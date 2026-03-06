import json
import os
import uuid
from datetime import datetime, timezone
import boto3

from utils.auth import get_user_id
from utils.dynamodb import put_item, get_item, query_items
from utils.response import success, error, cors

region_name = os.environ.get('AWS_REGION_NAME', 'ap-south-1')
s3_client = boto3.client('s3', region_name=region_name)
textract_client = boto3.client('textract', region_name=region_name)
BUCKET = os.environ.get('S3_BUCKET_NAME')

def handler(event, context):
    http_method = event.get('httpMethod')
    if http_method == 'OPTIONS':
        return cors()

    path = event.get('resource') or event.get('path', '')
    user_id = get_user_id(event)

    if not user_id:
        return error('Authentication required', 401, 'AUTH_001')

    try:
        # POST /materials/upload
        if http_method == 'POST' and '/upload' in path:
            body = json.loads(event.get('body', '{}'))
            file_name = body.get('fileName')
            file_type = body.get('fileType', 'application/pdf')
            file_size = body.get('fileSize', 0)

            if not file_name:
                return error('fileName is required', 400, 'VAL_001')
            if file_size > 50 * 1024 * 1024:
                return error('File must be under 50MB', 400, 'VAL_002')

            material_id = str(uuid.uuid4())
            s3_key = f"{user_id}/{material_id}.pdf"
            s3_uri = f"s3://{BUCKET}/{s3_key}"

            # Generate presigned URL
            presigned_url = s3_client.generate_presigned_url(
                ClientMethod='put_object',
                Params={
                    'Bucket': BUCKET,
                    'Key': s3_key,
                    'ContentType': file_type,
                },
                ExpiresIn=3600
            )

            now_str = datetime.now(timezone.utc).isoformat()
            
            put_item('LearningMaterials', {
                'userId': user_id,
                'materialId': material_id,
                'fileName': file_name,
                's3Uri': s3_uri,
                'extractedText': '',
                'uploadedAt': now_str,
                'status': 'processing',
            })

            # Start async text extraction
            try:
                textract_result = textract_client.start_document_text_detection(
                    DocumentLocation={
                        'S3Object': {'Bucket': BUCKET, 'Name': s3_key}
                    }
                )
                
                put_item('LearningMaterials', {
                    'userId': user_id,
                    'materialId': material_id,
                    'fileName': file_name,
                    's3Uri': s3_uri,
                    'extractedText': '',
                    'uploadedAt': now_str,
                    'status': 'processing',
                    'textractJobId': textract_result['JobId']
                })
            except Exception as e:
                print(f"Textract start failed: {str(e)}")

            return success({
                'materialId': material_id,
                'presignedUrl': presigned_url,
                's3Uri': s3_uri,
                'message': 'Upload URL generated. Upload file, then text extraction will begin.'
            })

        # GET /materials/{materialId}
        if http_method == 'GET' and event.get('pathParameters', {}).get('materialId'):
            material_id = event['pathParameters']['materialId']
            material = get_item('LearningMaterials', {'userId': user_id, 'materialId': material_id})

            if not material:
                return error('Material not found', 404, 'RES_001')

            if material.get('status') == 'processing' and material.get('textractJobId'):
                try:
                    job_result = textract_client.get_document_text_detection(
                        JobId=material['textractJobId']
                    )
                    
                    if job_result.get('JobStatus') == 'SUCCEEDED':
                        extracted_text = '\n'.join([
                            b.get('Text', '') for b in job_result.get('Blocks', []) 
                            if b.get('BlockType') == 'LINE'
                        ])
                        material['extractedText'] = extracted_text
                        material['status'] = 'ready'
                        put_item('LearningMaterials', material)
                    elif job_result.get('JobStatus') == 'FAILED':
                        material['status'] = 'failed'
                        put_item('LearningMaterials', material)
                except Exception as e:
                    print(f"Textract check failed: {str(e)}")

            return success(material)

        # GET /materials
        if http_method == 'GET':
            materials = query_items(
                'LearningMaterials',
                'userId = :uid',
                {':uid': user_id}
            )
            return success({'materials': materials})

        return error('Not found', 404, 'UPLOAD_404')
        
    except Exception as err:
        print(f"Upload error: {err}")
        return error(str(err) or 'Internal server error', 500, 'UPLOAD_500')
