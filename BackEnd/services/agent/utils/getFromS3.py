import os
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

def get_from_s3(object_key: str, expires_in: int = 600):
    bucket_name = os.environ.get('AWS_BUCKET_NAME')

    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
    except ClientError as e:
        # 404 Error means the key/file does not exist
        if e.response['Error']['Code'] == '404':
            return None  
        raise e

    # Step 2: Generate the URL if the file exists
    
    return s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket_name,
            'Key': object_key
        },
        ExpiresIn=expires_in
    )