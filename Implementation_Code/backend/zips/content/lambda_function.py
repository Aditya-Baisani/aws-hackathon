import json
import uuid
from datetime import datetime, timezone
import math

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

        # GET /content/explain/{topicId}
        if http_method == 'GET' and '/explain/' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            # Check cache
            cached = get_item('Explanations', {'topicId': topic_id, 'typeLanguage': f"standard#{language}"})
            if cached and cached.get('content'):
                return success({
                    'content': cached['content'],
                    'references': cached.get('references', []),
                    'cached': True
                })

            # Get topic context
            try:
                topics = query_items('Topics', 'planId = :pid', {':pid': topic_id})
            except Exception:
                topics = []
            topic = topics[0] if topics else {'title': topic_id, 'description': ''}

            hinglish_prompt = 'Use Hinglish — mix English technical terms with Hindi explanations naturally.'
            prompt = f"""You are an expert tutor explaining concepts to students.

Topic: {topic.get('title', topic_id)}
Context: {topic.get('description', 'General explanation')}
Language: {language}

Provide a comprehensive explanation that includes:
1. Core concept definition
2. Key principles or mechanisms
3. Practical examples
4. Common misconceptions to avoid

{hinglish_prompt if language == 'hinglish' else 'Use clear English.'}"""

            content = invoke_model(prompt, {'maxTokens': 2048, 'temperature': 0.7})

            now_str = datetime.now(timezone.utc).isoformat()
            expires_at = int(datetime.now(timezone.utc).timestamp()) + 30 * 24 * 3600

            put_item('Explanations', {
                'topicId': topic_id,
                'typeLanguage': f"standard#{language}",
                'content': content,
                'references': [],
                'generatedAt': now_str,
                'userId': user_id,
                'expiresAt': expires_at,
            })

            return success({'content': content, 'references': [], 'cached': False})

        # GET /content/simplify/{topicId}
        if http_method == 'GET' and '/simplify/' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            cached = get_item('Explanations', {'topicId': topic_id, 'typeLanguage': f"simplified#{language}"})
            if cached and cached.get('content'):
                return success({'content': cached['content'], 'cached': True})

            original = get_item('Explanations', {'topicId': topic_id, 'typeLanguage': f"standard#{language}"})
            original_text = f"Original explanation: {original['content'][:2000]}" if original else ''

            prompt = f"""You are explaining a complex topic to someone completely new to the subject.

Topic: {topic_id}
{original_text}
Language: {language}

Create a simplified explanation using:
1. Everyday analogies and metaphors
2. Simple vocabulary (avoid jargon)
3. Step-by-step breakdown
4. Real-world examples from daily life

{'Use Hinglish.' if language == 'hinglish' else 'Use simple English.'}"""

            content = invoke_model(prompt, {'maxTokens': 2048, 'temperature': 0.7})
            
            now_str = datetime.now(timezone.utc).isoformat()
            expires_at = int(datetime.now(timezone.utc).timestamp()) + 30 * 24 * 3600

            put_item('Explanations', {
                'topicId': topic_id,
                'typeLanguage': f"simplified#{language}",
                'content': content,
                'references': [],
                'generatedAt': now_str,
                'userId': user_id,
                'expiresAt': expires_at,
            })

            return success({'content': content, 'cached': False})

        # POST /content/clarify
        if http_method == 'POST' and '/clarify' in path:
            body = json.loads(event.get('body', '{}'))
            term = body.get('term')
            req_context = body.get('context')
            
            if not term:
                return error('term is required', 400, 'VAL_001')

            cached_items = query_items('Clarifications', 'userId = :uid', {':uid': user_id})
            existing = next((c for c in cached_items if c.get('term') == term and c.get('language') == language), None)
            
            if existing:
                return success({'explanation': existing['explanation'], 'cached': True})

            context_text = f"Context: {req_context}" if req_context else ""
            prompt = f"""Define and explain the following term:

Term: {term}
{context_text}
Language: {language}

Provide:
1. Clear definition
2. Explanation with examples
3. Why it matters

{'Use Hinglish.' if language == 'hinglish' else 'Use clear English.'}
Keep the answer concise (under 200 words)."""

            explanation = invoke_model(prompt, {'maxTokens': 1024, 'temperature': 0.6})

            put_item('Clarifications', {
                'userId': user_id,
                'clarificationId': str(uuid.uuid4()),
                'term': term,
                'context': req_context or '',
                'explanation': explanation,
                'language': language,
                'generatedAt': datetime.now(timezone.utc).isoformat(),
            })

            return success({'explanation': explanation, 'term': term, 'cached': False})

        # GET /content/references/{topicId}
        if http_method == 'GET' and '/references/' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            cached = get_item('Explanations', {'topicId': topic_id, 'typeLanguage': f"standard#{language}"})
            if cached and cached.get('references') and len(cached['references']) > 0:
                return success({'references': cached['references']})

            prompt = f"""Generate 3-5 high-quality external learning resources for the topic: {topic_id}

For each resource, provide:
1. Title
2. Type (article/video/documentation)
3. URL (use well-known educational platforms like MDN, W3Schools, Khan Academy, YouTube channels)
4. Brief description (1 sentence)

Output ONLY a JSON array like:
[^{{"title":"...","type":"article","url":"https://...","description":"..."}}^]"""

            response_text = invoke_model(prompt, {'maxTokens': 1024, 'temperature': 0.5})
            references = parse_json_response(response_text)

            return success({'references': references if isinstance(references, list) else []})

        return error('Not found', 404, 'CONTENT_404')
        
    except Exception as err:
        print(f"Content error: {err}")
        return error(str(err) or 'Internal server error', 500, 'CONTENT_500')
