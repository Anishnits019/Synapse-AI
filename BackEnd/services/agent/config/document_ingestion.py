from pathlib import Path
from fastapi import HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import io 
from .vectordb import COLLECTION_NAME, docs_ingestion
import boto3
from langchain.schema import Document
import os
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())

s3_client = boto3.client("s3")  # This picks up your AWS credentials from environment variables / .env
BUCKET_NAME = os.getenv.AWS_BUCKET_NAME

async def ingest_document(object_key: str, original_name: str):
    pdf_buffer=io.BytesIO()
    s3_client.download_fileobj(BUCKET_NAME,object_key,pdf_buffer)
    pdf_buffer.seek(0)

    reader=PyPDFLoader(pdf_buffer)
    pages=[]
    for i,pages in enumerate(reader.pages()):
        text+=pages.extract()
        pages.append(Document(page_content=text),metadata={"pages",i})
 
    if not any(page.page_content.strip() for page in pages):
        raise HTTPException(
            status_code=422,
            detail="This PDF contains no extractable text. Upload a text-based PDF or add OCR support for scanned PDFs.",
        )
    

    documents = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=400,
    ).split_documents(pages)

    for document in documents:
        document.metadata["source"] = original_name
        document.metadata["file_path"] = object_key

    await docs_ingestion(documents, COLLECTION_NAME)
    return {"indexed": True, "chunks": len(documents)}
