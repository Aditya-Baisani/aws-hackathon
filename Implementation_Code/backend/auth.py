import json
import os
from datetime import datetime, timezone
import boto3

from utils.auth import get_user_id
from utils.dynamodb import get_item, put_item, delete_item
from utils.response import success, error, cors

cognito_client = boto3.client('cognito-idp', region_name=os.environ.get('AWS_REGION_NAME', 'ap-south-1'))
USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')

def handler(event, context):
    http_method = event.get('httpMethod')
    if http_method == 'OPTIONS':
        return cors()

    path = event.get('resource') or event.get('path', '')
    
    try:
        # POST /auth/register
        if http_method == 'POST' and '/register' in path:
            body = json.loads(event.get('body', '{}'))
            user_id = get_user_id(event)
            
            if not user_id:
                return error('Authentication required', 401, 'AUTH_001')
                
            now_str = datetime.now(timezone.utc).isoformat()
            put_item('Users', {
                'userId': user_id,
                'email': body.get('email', ''),
                'languagePreference': body.get('languagePreference', 'english'),
                'createdAt': now_str,
                'lastLoginAt': now_str,
            })
            
            return success({'message': 'User profile created', 'userId': user_id})

        # POST /auth/login
        if http_method == 'POST' and '/login' in path:
            user_id = get_user_id(event)
            if not user_id:
                return error('Authentication required', 401, 'AUTH_001')
                
            user = get_item('Users', {'userId': user_id})
            now_str = datetime.now(timezone.utc).isoformat()
            
            if user:
                user['lastLoginAt'] = now_str
                put_item('Users', user)
            else:
                body = json.loads(event.get('body', '{}'))
                put_item('Users', {
                    'userId': user_id,
                    'email': body.get('email', ''),
                    'languagePreference': 'english',
                    'createdAt': now_str,
                    'lastLoginAt': now_str,
                })
                
            return success({'message': 'Login recorded'})

        # POST /auth/refresh
        if http_method == 'POST' and '/refresh' in path:
            return success({'message': 'Token refresh handled by Cognito client'})

        # DELETE /auth/user
        if http_method == 'DELETE' and '/user' in path:
            user_id = get_user_id(event)
            if not user_id:
                return error('Authentication required', 401, 'AUTH_001')
                
            delete_item('Users', {'userId': user_id})
            delete_item('Streaks', {'userId': user_id})
            delete_item('NotificationSchedules', {'userId': user_id})
            
            if USER_POOL_ID:
                try:
                    cognito_client.admin_delete_user(
                        UserPoolId=USER_POOL_ID,
                        Username=user_id
                    )
                except Exception as e:
                    print(f"Cognito delete failed: {str(e)}")
                    
            return success({'message': 'Account deleted successfully'})
            
        return error('Not found', 404, 'AUTH_404')
        
    except Exception as err:
        print(f"Auth error: {err}")
        return error(str(err) or 'Internal server error', 500, 'AUTH_500')
