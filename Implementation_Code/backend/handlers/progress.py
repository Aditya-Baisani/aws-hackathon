import json
from datetime import datetime, timezone, timedelta

from utils.auth import get_user_id
from utils.dynamodb import get_item, put_item, query_items
from utils.response import success, error, cors

def handler(event, context):
    http_method = event.get('httpMethod')
    if http_method == 'OPTIONS':
        return cors()

    # Handle EventBridge scheduled events (streak reset)
    if event.get('action') == 'resetStreaks':
        return handle_streak_reset()

    path = event.get('resource') or event.get('path', '')
    user_id = get_user_id(event)

    if not user_id:
        return error('Authentication required', 401, 'AUTH_001')

    try:
        # POST /progress/topics/{topicId}/complete
        if http_method == 'POST' and '/complete' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            found = False
            plan_id = None

            for plan in plans:
                for day in plan.get('days', []):
                    for topic in day.get('topics', []):
                        if topic.get('topicId') == topic_id:
                            topic['completed'] = True
                            topic['completedAt'] = datetime.now(timezone.utc).isoformat()
                            found = True
                            plan_id = plan.get('planId')
                            break
                    if found:
                        break
                if found:
                    put_item('StudyPlans', plan)
                    break

            if not found:
                return error('Topic not found', 404, 'RES_001')

            # Sync isolated Topics table
            try:
                topic_item = get_item('Topics', {'planId': plan_id, 'topicId': topic_id})
                if topic_item:
                    topic_item['completed'] = 'true'
                    topic_item['completedAt'] = datetime.now(timezone.utc).isoformat()
                    put_item('Topics', topic_item)
                else:
                    # fallback if topicId is the partition key
                    topic_item = get_item('Topics', {'topicId': topic_id})
                    if topic_item:
                        topic_item['completed'] = 'true'
                        topic_item['completedAt'] = datetime.now(timezone.utc).isoformat()
                        put_item('Topics', topic_item)
            except Exception as e:
                print(f"Topic sync skipped: {e}")

            recalculate_progress(user_id, plan_id, plans)
            streak = update_streak(user_id)

            return success({'message': 'Topic completed!', 'streak': streak})

        # DELETE /progress/topics/{topicId}/complete
        if http_method == 'DELETE' and '/complete' in path:
            topic_id = event.get('pathParameters', {}).get('topicId')
            if not topic_id:
                return error('topicId required', 400, 'VAL_001')

            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            found = False
            plan_id = None

            for plan in plans:
                for day in plan.get('days', []):
                    for topic in day.get('topics', []):
                        if topic.get('topicId') == topic_id:
                            topic['completed'] = False
                            topic['completedAt'] = None
                            found = True
                            plan_id = plan.get('planId')
                            break
                    if found:
                        break
                if found:
                    put_item('StudyPlans', plan)
                    break

            if not found:
                return error('Topic not found', 404, 'RES_001')

            recalculate_progress(user_id, plan_id, plans)
            return success({'message': 'Topic unmarked'})

        # GET /progress/streak  — MUST be checked before /{planId}
        if http_method == 'GET' and ('/streak' in path or path.endswith('/streak')):
            streak = get_item('Streaks', {'userId': user_id})
            if streak:
                return success(streak)
            return success({'currentStreak': 0, 'longestStreak': 0, 'activityDates': []})

        # GET /dashboard
        if http_method == 'GET' and (path == '/dashboard' or path.endswith('/dashboard')):
            plans = query_items('StudyPlans', 'userId = :uid', {':uid': user_id})
            streak = get_item('Streaks', {'userId': user_id}) or {'currentStreak': 0, 'longestStreak': 0}

            today = datetime.now(timezone.utc)
            today_str = today.strftime('%Y-%m-%d')
            
            today_topics = []
            total_topics = 0
            completed_total = 0
            completed_today = 0

            for plan in plans:
                if plan.get('days'):
                    try:
                        plan_start_str = plan.get('createdAt', '')
                        if plan_start_str.endswith('Z'):
                            plan_start_str = plan_start_str[:-1] + '+00:00'
                        plan_start = datetime.fromisoformat(plan_start_str)
                    except ValueError:
                        plan_start = today
                        
                    day_diff = (today - plan_start).days + 1

                    for day in plan.get('days', []):
                        for topic in day.get('topics', []):
                            total_topics += 1
                            if str(topic.get('completed')).lower() == 'true' or topic.get('completed') is True:
                                completed_total += 1
                                completed_at_str = topic.get('completedAt')
                                if completed_at_str:
                                    if completed_at_str.startswith(today_str):
                                        completed_today += 1

                            if day.get('dayNumber') == day_diff:
                                today_topics.append(topic)

            progress_percentage = round((completed_total / total_topics) * 100, 1) if total_topics > 0 else 0

            return success({
                'todayTopics': today_topics,
                'completedToday': completed_today,
                'progressPercentage': progress_percentage,
                'currentStreak': streak.get('currentStreak', 0),
                'longestStreak': streak.get('longestStreak', 0),
                'totalTopics': total_topics,
                'completedTotal': completed_total,
            })

        # GET /progress/{planId}
        if http_method == 'GET' and event.get('pathParameters', {}).get('planId'):
            plan_id = event['pathParameters']['planId']
            progress = get_item('Progress', {'userId': user_id, 'planId': plan_id})
            
            if progress:
                 return success(progress)
                 
            return success({
                'progressPercentage': 0, 
                'totalTopics': 0, 
                'completedTopics': []
            })

        return error('Not found', 404, 'PROG_404')
        
    except Exception as err:
        print(f"Progress error: {err}")
        return error(str(err) or 'Internal server error', 500, 'PROG_500')


def recalculate_progress(user_id, plan_id, plans):
    plan = next((p for p in plans if p.get('planId') == plan_id), None)
    if not plan:
        return

    total = 0
    completed = 0
    completed_topics_ids = []
    
    for day in plan.get('days', []):
        for topic in day.get('topics', []):
            total += 1
            if str(topic.get('completed')).lower() == 'true' or topic.get('completed') is True:
                completed += 1
                completed_topics_ids.append(topic.get('topicId'))

    percentage = round((completed / total) * 100, 1) if total > 0 else 0

    put_item('Progress', {
        'userId': user_id,
        'planId': plan_id,
        'completedTopics': completed_topics_ids,
        'totalTopics': total,
        'progressPercentage': percentage,
        'lastUpdated': datetime.now(timezone.utc).isoformat(),
    })


def update_streak(user_id):
    today_dt = datetime.now(timezone.utc)
    yesterday_dt = today_dt - timedelta(days=1)
    
    today = today_dt.strftime('%Y-%m-%d')
    yesterday = yesterday_dt.strftime('%Y-%m-%d')

    streak = get_item('Streaks', {'userId': user_id})

    if not streak:
        streak = {
            'userId': user_id,
            'currentStreak': 1,
            'longestStreak': 1,
            'lastActivityDate': today,
            'activityDates': [today],
        }
    elif streak.get('lastActivityDate') == today:
        return streak.get('currentStreak', 0)
    elif streak.get('lastActivityDate') == yesterday:
        streak['currentStreak'] = streak.get('currentStreak', 0) + 1
        streak['longestStreak'] = max(streak.get('longestStreak', 0), streak['currentStreak'])
        streak['lastActivityDate'] = today
        dates = streak.get('activityDates', [])
        dates.append(today)
        streak['activityDates'] = dates
    else:
        streak['currentStreak'] = 1
        streak['lastActivityDate'] = today
        dates = streak.get('activityDates', [])
        dates.append(today)
        streak['activityDates'] = dates

    put_item('Streaks', streak)
    return streak['currentStreak']


def handle_streak_reset():
    print(f"Streak reset job executed at {datetime.now(timezone.utc).isoformat()}")
    return {'statusCode': 200, 'body': 'OK'}
