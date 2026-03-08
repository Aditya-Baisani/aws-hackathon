import json
import os
import uuid
from datetime import datetime, timezone
import boto3

from utils.auth import get_user_id
from utils.dynamodb import put_item, get_item, query_items
from utils.response import success, error, cors

# AWS clients
region_name = os.environ.get('AWS_REGION_NAME', 'ap-south-1')
s3_client = boto3.client('s3', region_name=region_name)
textract_client = boto3.client('textract', region_name=region_name)

BUCKET = os.environ.get('S3_BUCKET_NAME')


def start_textract_job(user_id, material_id):
    """Start a Textract async job and return the JobId."""
    resp = textract_client.start_document_text_detection(
        DocumentLocation={
            "S3Object": {
                "Bucket": BUCKET,
                "Name": f"{user_id}/{material_id}.pdf"
            }
        }
    )
    return resp["JobId"]


def fetch_textract_results(job_id):
    """
    Check Textract job status and collect text if done.
    Returns (status, text): status is 'ready', 'processing', or 'failed'.
    """
    response = textract_client.get_document_text_detection(JobId=job_id)
    status = response["JobStatus"]

    if status == "SUCCEEDED":
        extracted_parts = []
        while True:
            blocks = response.get("Blocks", [])

            # Prefer LINE blocks; fall back to WORD blocks for digital PDFs
            page_text = [
                b.get("Text") for b in blocks
                if b["BlockType"] == "LINE" and b.get("Text")
            ]
            if not page_text:
                page_text = [
                    b.get("Text") for b in blocks
                    if b["BlockType"] == "WORD" and b.get("Text")
                ]

            extracted_parts.extend(page_text)

            next_token = response.get("NextToken")
            if not next_token:
                break
            response = textract_client.get_document_text_detection(
                JobId=job_id, NextToken=next_token
            )

        return "ready", "\n".join(extracted_parts)

    elif status == "FAILED":
        return "failed", ""

    # Still IN_PROGRESS
    return "processing", ""


def handler(event, context):
    http_method = event.get("httpMethod")

    if http_method == "OPTIONS":
        return cors()

    if not BUCKET:
        return error("S3_BUCKET_NAME not configured", 500)

    path_params = event.get("pathParameters") or {}
    user_id = get_user_id(event)

    if not user_id:
        return error("Authentication required", 401)

    try:
        resource = event.get("resource") or ""

        # ------------------------------------------------------------------ #
        # POST /upload                                                         #
        # Generates a presigned URL and saves the initial material record.    #
        # Frontend: PUT file to S3, then call POST /{materialId} to trigger   #
        # extraction. No new routes needed.                                   #
        # ------------------------------------------------------------------ #
        if http_method == "POST" and "/upload" in resource:
            body = json.loads(event.get("body", "{}"))
            file_name = body.get("fileName")
            if not file_name:
                return error("fileName required", 400)

            material_id = str(uuid.uuid4())
            s3_key = f"{user_id}/{material_id}.pdf"

            presigned_url = s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": BUCKET,
                    "Key": s3_key,
                    "ContentType": body.get("fileType", "application/pdf"),
                },
                ExpiresIn=3600,
            )

            material = {
                "userId": user_id,
                "materialId": material_id,
                "fileName": file_name,
                "s3Uri": f"s3://{BUCKET}/{s3_key}",
                "uploadedAt": datetime.now(timezone.utc).isoformat(),
                "status": "uploaded",
                "extractedText": "",
            }
            put_item("LearningMaterials", material)

            return success({"materialId": material_id, "presignedUrl": presigned_url})

        # ------------------------------------------------------------------ #
        # POST /materials/{materialId}                                         #
        # Starts Textract after the file is confirmed in S3.                  #
        # Called by frontend immediately after uploadToS3() succeeds.         #
        # Safely skips if already processing or done (idempotent).            #
        # ------------------------------------------------------------------ #
        if http_method == "POST" and path_params.get("materialId"):
            mid = path_params["materialId"]
            material = get_item("LearningMaterials", {"userId": user_id, "materialId": mid})
            if not material:
                return error("Not found", 404)

            if material.get("status") in ("processing", "ready"):
                return success({
                    "message": "Already processed or in progress",
                    "status": material["status"]
                })

            job_id = start_textract_job(user_id, mid)
            material.update({"textractJobId": job_id, "status": "processing"})
            put_item("LearningMaterials", material)
            return success({"message": "Extraction started", "jobId": job_id})

        # ------------------------------------------------------------------ #
        # GET /materials/{materialId}                                          #
        # Polls Textract status, saves extracted text to DB when done.        #
        # Frontend polls this until status === 'ready'.                       #
        # ------------------------------------------------------------------ #
        if http_method == "GET" and path_params.get("materialId"):
            mid = path_params["materialId"]
            material = get_item("LearningMaterials", {"userId": user_id, "materialId": mid})
            if not material:
                return error("Not found", 404)

            job_id = material.get("textractJobId")
            current_status = material.get("status")

            if job_id and current_status == "processing":
                new_status, extracted_text = fetch_textract_results(job_id)

                if new_status in ("ready", "failed"):
                    material["status"] = new_status
                    material["extractedText"] = extracted_text
                    put_item("LearningMaterials", material)

            return success(material)

        return error("Not found", 404)

    except Exception as e:
        print(f"Error: {str(e)}")
        return error(str(e), 500)