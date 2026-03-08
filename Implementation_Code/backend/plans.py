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
            body_raw = event.get('body') or '{}'
            body = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
            
            material_id = body.get('materialId')
            topic_name = body.get('topicName')
            daily_minutes = body.get('dailyMinutes')
            total_days = body.get('totalDays')
            learning_goal = body.get('learningGoal', 'exploration')

            # Validation
            if not material_id and not topic_name:
                return error('materialId or topicName is required', 400, 'VAL_001')
            if not daily_minutes or not (15 <= daily_minutes <= 480):
                return error('dailyMinutes must be 15-480', 400, 'VAL_002')
            if not total_days or not (1 <= total_days <= 365):
                return error('totalDays must be 1-365', 400, 'VAL_003')

            user = get_item('Users', {'userId': user_id})
            language = user.get('languagePreference', 'english') if user else 'english'

            prompt = ""
            if material_id:
                material = get_item('LearningMaterials', {'userId': user_id, 'materialId': material_id})
                if not material:
                    return error('Material not found', 404, 'RES_001')
                if material.get('status') != 'ready':
                    return error('Material is still processing', 400, 'VAL_004')

                extracted_text = material.get('extractedText', '')[:8000]
                prompt = f"""Analyze the following: {extracted_text}. 
                Create a study plan for {total_days} days, {daily_minutes} mins/day in {language}.
                Respond ONLY with JSON matching the structure: {{"days": [{{"dayNumber": 1, "topics": [{{"title": "...", "description": "...", "estimatedMinutes": 30}}]}}]}}"""
            
            elif topic_name:
                prompt = f"""Create a study plan for '{topic_name}' for {total_days} days, {daily_minutes} mins/day in {language}.
                Respond ONLY with JSON matching the structure: {{"days": [{{"dayNumber": 1, "topics": [{{"title": "...", "description": "...", "estimatedMinutes": 30}}]}}]}}"""

            response_text = invoke_model(prompt, {
                'maxTokens': 4096,
                'temperature': 0.5,
                'systemPrompt': 'You are an expert study planner. Always respond with valid JSON only.',
            })

            plan_data = parse_json_response(response_text)
            if not isinstance(plan_data, dict) or 'days' not in plan_data:
                return error('AI generated invalid structure', 502, 'PLAN_502')

            plan_id = str(uuid.uuid4())
            days = plan_data.get('days', [])
            total_topics_count = 0
            
            # --- FIXED PROCESSING LOGIC ---
            for day in days:
                day_topics = day.get('topics', [])
                if isinstance(day_topics, list):
                    total_topics_count += len(day_topics) # Count once per day
                    for topic in day_topics:
                        topic['topicId'] = str(uuid.uuid4())
                        topic['completed'] = False

            now_str = datetime.now(timezone.utc).isoformat()
            
            plan = {
                'planId': plan_id,
                'userId': user_id,
                'materialId': material_id or 'none',
                'topicName': topic_name or 'none',
                'dailyStudyMinutes': daily_minutes,
                'totalDays': total_days,
                'learningGoal': learning_goal,
                'days': days,
                'createdAt': now_str,
                'modifiedAt': now_str,
            }
            
            put_item('StudyPlans', plan)

            # Insert topics into the secondary table
            for day in days:
                day_num = day.get('dayNumber')
                for topic in day.get('topics', []):
                    put_item('Topics', {
                        'planId': plan_id,
                        'topicId': topic['topicId'],
                        'userId': user_id,
                        'title': topic.get('title', 'Untitled'),
                        'description': topic.get('description', ''),
                        'dayNumber': day_num,
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
        path_params = event.get('pathParameters') or {}
        plan_id_param = path_params.get('planId')

        if http_method == 'GET' and plan_id_param:
            plan = get_item('StudyPlans', {'userId': user_id, 'planId': plan_id_param})
            if not plan:
                return error('Plan not found', 404, 'RES_001')
            return success(plan)

        # GET /plans (List all)
        if http_method == 'GET' and path == '/plans':
            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            return success({'plans': plans})

        return error('Not found', 404, 'PLAN_404')
        
    except Exception as err:
        print(f"Plans error: {err}")
        return error(str(err), 500, 'PLAN_500')