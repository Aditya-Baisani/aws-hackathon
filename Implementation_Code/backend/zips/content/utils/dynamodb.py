import os
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key

# Use the resource wrapper which abstracts typed dictionaries automatically
dynamodb_resource = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION_NAME', 'ap-south-1'))
PREFIX = os.environ.get('TABLE_PREFIX', 'ai-tutor')

def get_table_name(name):
    return f"{PREFIX}-{name}"

def _replace_decimals(obj):
    if isinstance(obj, list):
        return [_replace_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: _replace_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        # Convert Decimals to float or int for standard JSON serialization later
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
        return obj

def get_item(table_name_suffix, key):
    table = dynamodb_resource.Table(get_table_name(table_name_suffix))
    response = table.get_item(Key=key)
    return _replace_decimals(response.get('Item'))

def put_item(table_name_suffix, item):
    table = dynamodb_resource.Table(get_table_name(table_name_suffix))
    table.put_item(Item=item)
    return item

def query_items(table_name_suffix, key_condition_expression, expression_values, index_name=None, limit=None, expr_names=None):
    table = dynamodb_resource.Table(get_table_name(table_name_suffix))
    
    params = {
        'KeyConditionExpression': key_condition_expression,
        'ExpressionAttributeValues': expression_values,
    }
    
    if index_name:
        params['IndexName'] = index_name
    if limit:
        params['Limit'] = limit
    if expr_names:
        params['ExpressionAttributeNames'] = expr_names
        
    response = table.query(**params)
    return _replace_decimals(response.get('Items', []))

def update_item(table_name_suffix, key, update_expr, expr_values, expr_names=None):
    table = dynamodb_resource.Table(get_table_name(table_name_suffix))
    params = {
        'Key': key,
        'UpdateExpression': update_expr,
        'ExpressionAttributeValues': expr_values,
        'ReturnValues': 'ALL_NEW',
    }
    if expr_names:
        params['ExpressionAttributeNames'] = expr_names
        
    response = table.update_item(**params)
    return _replace_decimals(response.get('Attributes'))

def delete_item(table_name_suffix, key):
    table = dynamodb_resource.Table(get_table_name(table_name_suffix))
    table.delete_item(Key=key)
