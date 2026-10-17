import boto3
import os
from dotenv import load_dotenv, find_dotenv
from urllib.parse import quote
load_dotenv(find_dotenv())

s3 = boto3.client('s3')
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
REGION = os.getenv("AWS_DEFAULT_REGION")

def upload_to_s3(file_name, buffer, content_type):
    object_key = f"generated-pdfs/{file_name}"

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=object_key,
        Body=buffer,
        ContentType=content_type,
    )

    return object_key
