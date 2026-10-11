from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from ..config.upload import upload_file 
from ..config.document_ingestion import ingest_document
from ..controllers.agent_controller import AgentRequest,SendMessage

agent_router=APIRouter()

@agent_router.post("/send-messages")
async def agent_route(body:AgentRequest, user_id: str | None = Header(default=None, alias="x-user-id")):
   if not user_id:
      raise HTTPException(status_code=400, detail="User ID header (x-user-id) is required")
   print(body)
   return await SendMessage(body, user_id)

@agent_router.post("/upload")
async def agent_upload_files(files: list[UploadFile] = File(..., alias="file")):
   uploaded_files = []
   try:
      for file in files:
         uploaded_file = await upload_file(file)
         uploaded_file["type"] = "pdf" if file.content_type == "application/pdf" else "image"
         uploaded_file["index"] = await ingest_document(
            uploaded_file["file_path"],
            uploaded_file["name"],
         )
         uploaded_files.append(uploaded_file)
      return {"files": uploaded_files}
   except HTTPException:
      raise
   except Exception as error:
      raise HTTPException(status_code=500, detail=f"File upload or PDF indexing failed: {error}") from error



