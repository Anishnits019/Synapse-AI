from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from ..config.document_ingestion import ingest_document
from ..controllers.agent_controller import AgentRequest,SendMessage
from ..utils.getFromS3 import get_from_s3
from ..utils.uploadTos3 import upload_to_s3
import uuid
from pathlib import Path

agent_router=APIRouter()

@agent_router.post("/send-messages")
async def agent_route(body:AgentRequest, user_id: str | None = Header(default=None, alias="x-user-id")):
   if not user_id:
      raise HTTPException(status_code=400, detail="User ID header (x-user-id) is required")
   return await SendMessage(body, user_id)

@agent_router.post("/upload")
async def agent_upload_files(files: list[UploadFile] = File(..., alias="file")):
   uploaded_files = []
   content_type=None
   try:
      for file in files:
         header=await file.read(12)
         await file.seek(0)
         
         if header.startswith(b"%PDF-"):
            content_type = "application/pdf"
         elif header.startswith(b"\xff\xd8\xff"):
            content_type = "image/jpeg"
         elif header.startswith(b"\x89PNG\r\n\x1a\n"):
            content_type = "image/png"
         elif header.startswith(b"RIFF") and header[8:12] == b"WEBP":
            content_type = "image/webp"
         else:
            raise HTTPException(
               status_code=400,
               detail=f"Unsupported file type for file {file.filename or 'unknown'}",
         )
      
         original_name = file.filename or "uploaded-file"
         safe_name = Path(original_name).name
         filename = f"{uuid.uuid4()}/{safe_name}"

         if content_type == "application/pdf":
            object_key = upload_to_s3(filename, file.file, content_type)
            index_result = await ingest_document(object_key, safe_name)
            print(index_result)
            file_type = "pdf"

         elif content_type in ["image/jpeg", "image/png", "image/webp"]:
            image_filename = f"uploaded_images/{uuid.uuid4()}/{safe_name}"
            object_key = upload_to_s3(image_filename, file.file, content_type)
            index_result = None
            file_type = "image"

         else:
            raise HTTPException(
               status_code=400,
               detail=f"Unsupported file type: {content_type or 'unknown'}",
            )

         file_url = get_from_s3(object_key, expires_in=3600)
         if not file_url:
            raise HTTPException(status_code=500, detail="Uploaded file could not be accessed from S3")

         uploaded_file = {
            "name": safe_name,
            "type": file_type,
            "file_path": file_url,
            "s3_key": object_key,
            "content_type": content_type,
         }
         
         if index_result is not None:
            uploaded_file["index"] = index_result
         uploaded_files.append(uploaded_file)
      return {"files": uploaded_files}
   except HTTPException:
      raise
   except Exception as error:
      raise HTTPException(status_code=500, detail=f"File upload or processing failed: {error}") from error
