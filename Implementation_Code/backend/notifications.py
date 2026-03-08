import json
import os
from datetime import datetime, timezone
import boto3

from utils.auth import get_user_id
from utils.dynamodb import get_item, put_item
from utils.response import success, error, cors

sns_client = boto3.client('sns', region_name=os.environ.get('AWS_REGION_NAME', 'ap-south-1'))
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def handler(event, context):
    http_method = event.get('httpMethod')
    if http_method == 'OPTIONS':
        return cors()

    # Handle EventBridge scheduled events
    if event.get('action') == 'processScheduled':
        return process_scheduled_notifications()

    path = event.get('resource') or event.get('path', '')
    user_id = get_user_id(event)

    if not user_id:
        return error('Authentication required', 401, 'AUTH_001')

    try:
        # PUT /notifications/preferences
        if http_method == 'PUT' and '/preferences' in path:
            body = json.loads(event.get('body', '{}'))

            existing = get_item('NotificationSchedules', {'userId': user_id}) or {}

            # Handle defaults explicitly since 'False' enabled checks should be aware
            enabled_val = body.get('enabled')
            if enabled_val is None:
                enabled_val = existing.get('enabled', True)

            prefs = {
                'userId': user_id,
                'preferredHours': body.get('preferredHours', existing.get('preferredHours', [9, 18])),
                'frequency': body.get('frequency', existing.get('frequency', 'daily')),
                'enabled': enabled_val,
                'timezone': body.get('timezone', existing.get('timezone', 'Asia/Kolkata')),
            }

            put_item('NotificationSchedules', prefs)

            # Update language preference if provided
            if 'languagePreference' in body:
                user = get_item('Users', {'userId': user_id})
                if user:
                    user['languagePreference'] = body['languagePreference']
                    put_item('Users', user)

            return success({'message': 'Preferences updated', 'prefs': prefs})

        # GET /notifications/history
        if http_method == 'GET' and '/history' in path:
            return success({'notifications': []})

        return error('Not found', 404, 'NOTIF_404')
        
    except Exception as err:
        print(f"Notification error: {err}")
        return error(str(err) or 'Internal server error', 500, 'NOTIF_500')


def process_scheduled_notifications():
    print(f"Processing scheduled notifications at {datetime.now(timezone.utc).isoformat()}")
    # Placeholder logic
    return {'statusCode': 200, 'body': 'Notifications processed'}


def send_notification(user_id, message):
    if not SNS_TOPIC_ARN:
        print('SNS_TOPIC_ARN not configured, skipping notification')
        return

    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=message,
            Subject='AI Tutor - Study Reminder',
            MessageAttributes={
                'userId': {
                    'DataType': 'String',
                    'StringValue': user_id
                }
            }
        )
        print(f"Notification sent to user {user_id}")
    except Exception as e:
        print(f"SNS send failed: {str(e)}")


def generate_message(progress, streak, today_topics, language):
    if progress >= 80:
        return f"🎉 Bahut badhiya! Aap {progress}% complete kar chuke hain!" if language == 'hinglish' else f"🎉 Great job! You're {progress}% complete!"
    elif streak > 0:
        return f"🔥 {streak} din ka streak! Aaj bhi continue karein?" if language == 'hinglish' else f"🔥 {streak} day streak! Keep it going today?"
    else:
        return f"📚 Aaj {today_topics} topics pending hain. Chalo shuru karein!" if language == 'hinglish' else f"📚 You have {today_topics} topics for today. Let's get started!"
