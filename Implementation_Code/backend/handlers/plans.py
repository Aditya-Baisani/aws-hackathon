import json
import uuid
from datetime import datetime, timezone

from utils.auth import get_user_id
from utils.dynamodb import get_item, put_item, query_items
from utils.bedrock import invoke_model, parse_json_response
from utils.response import success, error, cors

def handler(event, context):
    http_method = event.get('httpMethod')
    if http_method == 'OPTIONS':
        return cors()

    path = event.get('resource') or event.get('path', '')
    user_id = get_user_id(event)

    if not user_id:
        return error('Authentication required', 401, 'AUTH_001')

    try:
        # POST /plans/generate
        if http_method == 'POST' and '/generate' in path:
            body = json.loads(event.get('body', '{}'))
            material_id = body.get('materialId')
            topic_name = body.get('topicName')
            daily_minutes = body.get('dailyMinutes')
            total_days = body.get('totalDays')
            learning_goal = body.get('learningGoal', 'exploration')

            if not material_id and not topic_name:
                return error('materialId or topicName is required', 400, 'VAL_001')
            if not daily_minutes or daily_minutes < 15 or daily_minutes > 480:
                return error('dailyMinutes must be 15-480', 400, 'VAL_002')
            if not total_days or total_days < 1 or total_days > 365:
                return error('totalDays must be 1-365', 400, 'VAL_003')

            user = get_item('Users', {'userId': user_id})
            language = user.get('languagePreference', 'english') if user else 'english'

            prompt = ""
            
            if material_id:
                # Flow 1: Generate from uploaded material
                material = get_item('LearningMaterials', {'userId': user_id, 'materialId': material_id})
                if not material:
                    return error('Material not found', 404, 'RES_001')
                if material.get('status') != 'ready':
                    return error('Material is still processing', 400, 'VAL_004')

                extracted_text = material.get('extractedText', '')[:8000]
                prompt = f"""You are an expert educational planner. Analyze the following learning material and create a structured study plan.

Learning Material:
{extracted_text}

Student Parameters:
- Daily study time: {daily_minutes} minutes
- Total days available: {total_days} days
- Learning goal: {learning_goal}
- Language preference: {language}

Instructions:
1. Identify key topics and concepts from the material
2. Organize topics in logical learning sequence (foundational → advanced)
3. Distribute topics across {total_days} days based on complexity and {daily_minutes} minutes per day
4. For each day, specify: dayNumber, topics array with title, description, estimatedMinutes

Output ONLY a JSON object with this exact structure:
{{
  "days": [
    {{
      "dayNumber": 1,
      "totalEstimatedMinutes": 60,
      "topics": [
        {{ "title": "Topic Name", "description": "Brief description", "estimatedMinutes": 30 }}
      ]
    }}
  ]
}}"""
            elif topic_name:
                # Flow 2: Generate from a manual topic name
                prompt = f"""You are an expert educational planner. Create a structured study plan for the topic: '{topic_name}'.

Student Parameters:
- Daily study time: {daily_minutes} minutes
- Total days available: {total_days} days
- Learning goal: {learning_goal}
- Language preference: {language}

Instructions:
1. Identify key concepts required to master the topic '{topic_name}'
2. Organize topics in logical learning sequence (foundational → advanced)
3. Distribute topics across {total_days} days based on complexity and {daily_minutes} minutes per day
4. Expand on subtopics to ensure comprehensive coverage across all {total_days} days.
5. For each day, specify: dayNumber, topics array with title, description, estimatedMinutes

Output ONLY a JSON object with this exact structure:
{{
  "days": [
    {{
      "dayNumber": 1,
      "totalEstimatedMinutes": 60,
      "topics": [
        {{ "title": "Topic Name", "description": "Brief description", "estimatedMinutes": 30 }}
      ]
    }}
  ]
}}"""

            response_text = invoke_model(prompt, {
                'maxTokens': 4096,
                'temperature': 0.5,
                'systemPrompt': 'You are an expert study planner. Always respond with valid JSON only.',
            })

            plan_data = parse_json_response(response_text)
            plan_id = str(uuid.uuid4())

            days = plan_data.get('days', [])
            total_topics_count = 0
            
            for day in days:
                topics = day.get('topics', [])
                for topic in topics:
                    topic['topicId'] = str(uuid.uuid4())
                    topic['completed'] = False
                total_topics_count += len(topics)

            now_str = datetime.now(timezone.utc).isoformat()
            
            plan = {
                'planId': plan_id,
                'userId': user_id,
                'materialId': material_id if material_id else 'none',
                'topicName': topic_name if topic_name else 'none',
                'dailyStudyMinutes': daily_minutes,
                'totalDays': total_days,
                'learningGoal': learning_goal,
                'days': days,
                'createdAt': now_str,
                'modifiedAt': now_str,
            }
            
            store_plan = plan.copy()
            put_item('StudyPlans', store_plan)

            for day in days:
                for topic in day.get('topics', []):
                    put_item('Topics', {
                        'planId': plan_id,
                        'topicId': topic['topicId'],
                        'userId': user_id,
                        'title': topic.get('title', ''),
                        'description': topic.get('description', ''),
                        'dayNumber': day.get('dayNumber'),
                        'estimatedMinutes': topic.get('estimatedMinutes', 30),
                        'completed': 'false', 
                        'completedAt': None,
                    })

            put_item('Progress', {
                'userId': user_id,
                'planId': plan_id,
                'completedTopics': [],
                'totalTopics': total_topics_count,
                'progressPercentage': 0,
                'lastUpdated': now_str,
            })

            return success({'plan': plan, 'message': 'Study plan generated!'})

        # GET /plans/{planId}
        if http_method == 'GET' and event.get('pathParameters', {}).get('planId'):
            plan_id = event['pathParameters']['planId']
            plan = get_item('StudyPlans', {'userId': user_id, 'planId': plan_id})
            if not plan:
                return error('Plan not found', 404, 'RES_001')
            return success(plan)

        # PUT /plans/{planId}
        if http_method == 'PUT' and event.get('pathParameters', {}).get('planId'):
            plan_id = event['pathParameters']['planId']
            body = json.loads(event.get('body', '{}'))
            plan = get_item('StudyPlans', {'userId': user_id, 'planId': plan_id})

            if not plan:
                return error('Plan not found', 404, 'RES_001')

            plan['dailyStudyMinutes'] = body.get('dailyMinutes', plan.get('dailyStudyMinutes'))
            plan['totalDays'] = body.get('totalDays', plan.get('totalDays'))
            plan['modifiedAt'] = datetime.now(timezone.utc).isoformat()

            put_item('StudyPlans', plan)
            return success({'plan': plan, 'message': 'Plan updated'})

        # GET /plans
        if http_method == 'GET':
            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            return success({'plans': plans})

        return error('Not found', 404, 'PLAN_404')
        
    except Exception as err:
        print(f"Plans error: {err}")
        return error(str(err) or 'Internal server error', 500, 'PLAN_500')
