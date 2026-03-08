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
        user = get_item('Users', {'userId': user_id})
        language = user.get('languagePreference', 'english') if user else 'english'

        # POST /quizzes/generate/topic/{topicId}
        if http_method == 'POST' and '/generate/topic/' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            topic_title = topic_id
            topic_description = ""
            try:
                plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
                for plan in plans:
                    for day in plan.get('days', []):
                        for t in day.get('topics', []):
                            if t.get('topicId') == topic_id:
                                topic_title = t.get('title', topic_id)
                                topic_description = t.get('description', "")
                                break
                        if topic_title != topic_id: break
                    if topic_title != topic_id: break
            except Exception:
                pass

            explanation = get_item('Explanations', {'topicId': topic_id, 'typeLanguage': f"standard#{language}"})
            topic_content = explanation.get('content', topic_description or topic_title) if explanation else (topic_description or topic_title)

            prompt = f"""Generate 5 multiple-choice questions to assess understanding of this topic.

Topic: {topic_title}
Content: {topic_content[:3000]}
Language: {language}

For each question:
1. Create a clear, specific question
2. Provide 4 answer options (A, B, C, D)
3. Mark the correct answer
4. Provide a brief explanation for the correct answer

Output ONLY a JSON object:
{{
  "questions": [
    {{
      "questionId": "q1",
      "questionText": "...",
      "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
      "correctAnswer": "A",
      "explanation": "...",
      "topicTags": ["{topic_id}"]
    }}
  ]
}}"""

            response_text = invoke_model(prompt, {'maxTokens': 3000, 'temperature': 0.6})
            quiz_data = parse_json_response(response_text)

            quiz_id = str(uuid.uuid4())
            quiz = {
                'quizId': quiz_id,
                'userId': user_id,
                'type': 'topic',
                'topicIds': [topic_id],
                'questions': quiz_data.get('questions', []),
                'language': language,
                'createdAt': datetime.now(timezone.utc).isoformat(),
            }
            # Unpack into map for dynamo put_item
            store_quiz = quiz.copy()
            put_item('Quizzes', store_quiz)

            return success({'quiz': quiz})

        # POST /quizzes/generate/context
        if http_method == 'POST' and '/generate/context' in path:
            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            completed_topics = []

            for plan in plans:
                for day in plan.get('days', []):
                    for topic in day.get('topics', []):
                        if str(topic.get('completed')).lower() == 'true' or topic.get('completed') is True:
                            completed_topics.append(topic)

            if len(completed_topics) < 3:
                return error('Complete at least 3 topics before taking a context-aware quiz', 400, 'VAL_002')

            topics_list = ", ".join([t.get('title', '') for t in completed_topics[:10]])

            prompt = f"""Generate 5-10 multiple-choice questions that require synthesizing knowledge ONLY across the provided completed topics. 
DO NOT include outside concepts not related to these topics.

Completed Topics: {topics_list}
Language: {language}

Create questions that:
1. Strictly connect concepts from the provided topics ONLY
2. Test ability to apply these specific concepts together
3. Require critical thinking based ON THE PROVIDED TOPICS

Output ONLY a JSON object:
{{
  "questions": [
    {{
      "questionId": "cq1",
      "questionText": "...",
      "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
      "correctAnswer": "B",
      "explanation": "...",
      "topicTags": ["topic1", "topic2"]
    }}
  ]
}}"""

            response_text = invoke_model(prompt, {'maxTokens': 4096, 'temperature': 0.6})
            quiz_data = parse_json_response(response_text)

            quiz_id = str(uuid.uuid4())
            quiz = {
                'quizId': quiz_id,
                'userId': user_id,
                'type': 'context-aware',
                'topicIds': [t.get('topicId') for t in completed_topics],
                'questions': quiz_data.get('questions', []),
                'language': language,
                'createdAt': datetime.now(timezone.utc).isoformat(),
            }
            store_quiz = quiz.copy()
            put_item('Quizzes', store_quiz)

            return success({'quiz': quiz})

        # POST /quizzes/{quizId}/submit
        if http_method == 'POST' and '/submit' in path:
            quiz_id = event.get('pathParameters', {}).get('quizId')
            body = json.loads(event.get('body', '{}'))
            answers = body.get('answers', {})

            quiz = get_item('Quizzes', {'userId': user_id, 'quizId': quiz_id})
            if not quiz:
                return error('Quiz not found', 404, 'RES_001')

            correct = 0
            questions = quiz.get('questions', [])
            total = len(questions)
            
            for q in questions:
                if answers.get(q.get('questionId')) == q.get('correctAnswer'):
                    correct += 1
                    
            score = round((correct / total) * 100) if total > 0 else 0

            result_id = str(uuid.uuid4())
            put_item('QuizResults', {
                'userId': user_id,
                'resultId': result_id,
                'quizId': quiz_id,
                'answers': answers,
                'score': score,
                'completedAt': datetime.now(timezone.utc).isoformat(),
            })

            msg = '🎉 Excellent work!' if score >= 80 else '👍 Good job!' if score >= 60 else '📚 Keep studying!'
            return success({
                'resultId': result_id,
                'score': score,
                'correct': correct,
                'total': total,
                'message': msg
            })

        # GET /quizzes/{quizId}/results
        if http_method == 'GET' and '/results' in path:
            quiz_id = event.get('pathParameters', {}).get('quizId')
            results = query_items('QuizResults', 'userId = :uid', {':uid': user_id})
            quiz_results = [r for r in results if r.get('quizId') == quiz_id]
            return success({'results': quiz_results})

        return error('Not found', 404, 'QUIZ_404')
        
    except Exception as err:
        print(f"Quiz error: {err}")
        return error(str(err) or 'Internal server error', 500, 'QUIZ_500')
