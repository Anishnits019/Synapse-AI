from pathlib import Path

from fastapi import HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from .vectordb import COLLECTION_NAME, docs_ingestion


async def ingest_document(file_path: str, original_name: str):
    
    if Path(file_path).suffix.lower() != ".pdf":
        return {"indexed": False, "chunks": 0}

    pages = PyPDFLoader(file_path).load()
    
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
        document.metadata["file_path"] = file_path

    await docs_ingestion(documents, COLLECTION_NAME)
    return {"indexed": True, "chunks": len(documents)}
