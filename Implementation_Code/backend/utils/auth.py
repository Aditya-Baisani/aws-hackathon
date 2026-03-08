import base64
import json
import os
import boto3

# Global cognito client
cognito_client = boto3.client('cognito-idp', region_name=os.environ.get('AWS_REGION_NAME', 'ap-south-1'))

def get_user_id(event):
    """
    Extract userId from the API Gateway event's authorization header.
    In a real setup, API Gateway + Cognito Authorizer does this automatically
    and provides the claims in event.requestContext.authorizer.claims.
    """
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        if 'sub' in claims:
            return claims['sub']
        if 'cognito:username' in claims:
            return claims['cognito:username']

        # Fallback: extract from JWT in Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        if auth_header:
            token = auth_header.replace('Bearer ', '')
            payload_str = token.split('.')[1]
            # Add padding if needed
            payload_str += '=' * (-len(payload_str) % 4)
            payload = json.loads(base64.b64decode(payload_str).decode('utf-8'))
            return payload.get('sub') or payload.get('cognito:username')
    except Exception:
        # ignore parse errors
        pass

    return None

def get_user_email(event):
    """
    Get user email from claims
    """
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    return claims.get('email', None)
