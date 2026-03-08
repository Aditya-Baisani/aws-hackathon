import json

def _cors_headers():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    }

def success(body, status_code=200):
    return {
        'statusCode': status_code,
        'headers': _cors_headers(),
        'body': json.dumps(body)
    }

def error(message, status_code=400, code='ERROR'):
    return {
        'statusCode': status_code,
        'headers': _cors_headers(),
        'body': json.dumps({
            'error': code,
            'message': str(message)
        })
    }

def cors():
    return {
        'statusCode': 200,
        'headers': _cors_headers(),
        'body': ''
    }
