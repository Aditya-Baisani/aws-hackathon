import json
import os
import boto3

bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION_NAME', 'ap-south-1'))
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-lite-v1:0')

def invoke_model(prompt, options=None):
    """
    Invoke Amazon Bedrock with a prompt using the configured model.
    Supports Amazon Nova models (Lite, Pro, Micro).
    """
    if options is None:
        options = {}
    
    max_tokens = options.get('maxTokens', 2048)
    temperature = options.get('temperature', 0.7)
    system_prompt = options.get('systemPrompt', '')

    messages = [
        {'role': 'user', 'content': [{'text': prompt}]}
    ]

    body = {
        'messages': messages,
        'inferenceConfig': {
            'maxTokens': max_tokens,
            'temperature': temperature,
            'topP': 0.9
        }
    }

    if system_prompt:
        body['system'] = [{'text': system_prompt}]

    response = bedrock_client.invoke_model(
        modelId=MODEL_ID,
        contentType='application/json',
        accept='application/json',
        body=json.dumps(body)
    )

    response_body = json.loads(response['body'].read().decode('utf-8'))

    # Extract text from Nova response format
    output_message = response_body.get('output', {}).get('message', {})
    if output_message.get('content') and len(output_message['content']) > 0 and 'text' in output_message['content'][0]:
        return output_message['content'][0]['text']

    # Fallback for different response formats
    if 'completion' in response_body:
        return response_body['completion']
    if 'content' in response_body and len(response_body['content']) > 0 and 'text' in response_body['content'][0]:
        return response_body['content'][0]['text']

    return json.dumps(response_body)

def parse_json_response(text):
    """
    Parse JSON from model response, handling markdown code blocks.
    """
    import re
    # Try extracting JSON from ```json ... ``` blocks
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if json_match:
        return json.loads(json_match.group(1).strip())

    # Try parsing the whole text as JSON
    trimmed = text.strip()
    if trimmed.startswith('[') or trimmed.startswith('{'):
        return json.loads(trimmed)

    raise ValueError('No valid JSON found in response')
