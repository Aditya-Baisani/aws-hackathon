import json
import uuid
from datetime import datetime, timezone

from utils.auth import get_user_id
from utils.dynamodb import get_item, put_item, query_items
from utils.bedrock import invoke_model
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

        # POST /doubts/session - Create new doubt session
        if http_method == 'POST' and path.endswith('/session'):
            body = json.loads(event.get('body', '{}'))
            session_id = str(uuid.uuid4())

            now_str = datetime.now(timezone.utc).isoformat()
            expires_at = int(datetime.now(timezone.utc).timestamp()) + 7 * 24 * 3600

            put_item('DoubtSessions', {
                'userId': user_id,
                'sessionId': session_id,
                'startedAt': now_str,
                'endedAt': None,
                'currentContext': {
                    'topicId': body.get('topicId'),
                    'topicTitle': body.get('topicTitle'),
                    'learningGoal': body.get('learningGoal', 'exploration'),
                },
                'conversation': [],
                'expiresAt': expires_at,
            })

            return success({'sessionId': session_id, 'message': 'Doubt session created'})

        # POST /doubts/ask - Ask a question in a session
        if http_method == 'POST' and '/ask' in path:
            body = json.loads(event.get('body', '{}'))
            session_id = body.get('sessionId')
            question = body.get('question')

            if not session_id:
                return error('sessionId required', 400, 'VAL_001')
            if not question:
                return error('question required', 400, 'VAL_002')

            session = get_item('DoubtSessions', {'userId': user_id, 'sessionId': session_id})
            if not session:
                return error('Session not found', 404, 'RES_001')

            convo_history = session.get('conversation', [])
            recent_convo_arr = [f"Student: {ex.get('question')}\nTutor: {ex.get('answer')}" for ex in convo_history[-3:]]
            recent_convo = '\n\n'.join(recent_convo_arr)
            
            ctx = session.get('currentContext', {})
            topic_title = ctx.get('topicTitle', 'General topics')
            learning_goal = ctx.get('learningGoal', 'learning')

            lang_instr = 'Hinglish (mix English technical terms with Hindi)' if language == 'hinglish' else 'clear English'
            prev_convo_str = f"Previous conversation:\n{recent_convo}\n\n" if recent_convo else ""

            prompt = f"""You are a helpful, encouraging AI tutor answering student doubts in real-time. Be conversational, warm, and supportive — like a real learning coach.

Student's current context:
- Currently studying: {topic_title}
- Learning goal: {learning_goal}
- Language preference: {language}

{prev_convo_str}Student's question: {question}

Provide a clear, concise answer that:
1. Directly addresses the question with enthusiasm
2. Uses {lang_instr}
3. Includes a brief example if helpful
4. Relates to their current topic when relevant
5. Encourages the student

Keep the answer focused and under 200 words. Be conversational, not robotic."""

            answer = invoke_model(prompt, {
                'maxTokens': 1024,
                'temperature': 0.7,
                'systemPrompt': 'You are an encouraging, knowledgeable AI tutor. Be warm, conversational, and helpful. Use emojis sparingly to keep things friendly.',
            })

            exchange = {
                'exchangeId': str(uuid.uuid4()),
                'question': question,
                'answer': answer,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'language': language,
            }
            
            convo_history.append(exchange)
            session['conversation'] = convo_history
            put_item('DoubtSessions', session)

            # Track frequent doubts
            track_frequent_doubt(question, answer, language)

            return success({'answer': answer, 'sessionId': session_id})

        # GET /doubts/session/{sessionId}
        if http_method == 'GET' and event.get('pathParameters', {}).get('sessionId'):
            session_id = event['pathParameters']['sessionId']
            session = get_item('DoubtSessions', {'userId': user_id, 'sessionId': session_id})
            if not session:
                return error('Session not found', 404, 'RES_001')
            return success(session)

        # DELETE /doubts/session/{sessionId}
        if http_method == 'DELETE' and event.get('pathParameters', {}).get('sessionId'):
            session_id = event['pathParameters']['sessionId']
            session = get_item('DoubtSessions', {'userId': user_id, 'sessionId': session_id})
            if session:
                session['endedAt'] = datetime.now(timezone.utc).isoformat()
                put_item('DoubtSessions', session)
            return success({'message': 'Session closed'})

        # GET /doubts/frequent
        if http_method == 'GET' and '/frequent' in path:
            try:
                frequent_doubts = query_items(
                    'FrequentDoubts',
                    '#lang = :lang',
                    {':lang': language},
                    expr_names={'#lang': 'language'},
                    index_name=None,
                    limit=20
                )
            except Exception:
                frequent_doubts = []
            return success({'doubts': frequent_doubts})

        return error('Not found', 404, 'DOUBT_404')
        
    except Exception as err:
        print(f"Doubt error: {err}")
        return error(str(err) or 'Internal server error', 500, 'DOUBT_500')


def track_frequent_doubt(question, answer, language):
    try:
        doubts = query_items('FrequentDoubts', '#lang = :lang', {':lang': language}, expr_names={'#lang': 'language'})
    except Exception:
        doubts = []
        
    existing = next((d for d in doubts if str(d.get('question', '')).lower() == question.lower()), None)

    if existing:
        existing['frequency'] = existing.get('frequency', 0) + 1
        existing['answer'] = answer
        put_item('FrequentDoubts', existing)
    else:
        put_item('FrequentDoubts', {
            'language': language,
            'doubtId': str(uuid.uuid4()),
            'question': question,
            'answer': answer,
            'frequency': 1,
            'relatedTopics': [],
        })
