import base64
import io
import os
from pathlib import Path
from ..config.llm_model import getModel
from ..utils.uploadTos3 import upload_to_s3
from dotenv import find_dotenv, load_dotenv
import boto3
import pymupdf as fitz

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.messages import HumanMessage, SystemMessage
from ..exception import AgentResponseError
from ..logger import logging

from .vectordb import COLLECTION_NAME, docs_ingestion
# Load environment variables
load_dotenv(find_dotenv())

s3_client = boto3.client("s3")  # This picks up your AWS credentials from environment variables / .env
BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

IMAGE_SYSTEM_PROMPT = """You are an expert visual analysis assistant.
Base every claim only on visible evidence in the supplied image.
If an image detail is unclear or absent, say so explicitly.
Describe objects, layout, colors, text, and relationships accurately.
Answer the user's question directly without mentioning internal tools."""

async def image_caption_generation(image_bytes:bytes,image_ext:str):
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")

    try:

        content = [{
            "type": "text",
            "text": "Analyze this image extracted from a document. Provide a detailed description of any charts, graphs, diagrams, or key data points inside it so it can be used for search retrieval."
    }]

        content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/{image_ext};base64,{encoded_image}"
                    },
                })
        
        response = await getModel("image_analyzer").ainvoke([
                SystemMessage(content=IMAGE_SYSTEM_PROMPT),
                HumanMessage(content=content),
            ])

        return getattr(response, "content", "").strip()
    
    except Exception as e:
        logging.exception("Image caption generation failed for an extracted PDF image.")
        raise AgentResponseError(
            "Image caption generation failed; check the Python service logs and image model configuration."
        ) from e
           

async def ingest_document(object_key: str, original_name: str):
    extracted_documents=[]

    try:
        pdf_buffer=io.BytesIO()
        s3_client.download_fileobj(BUCKET_NAME,object_key,pdf_buffer)
        pdf_buffer.seek(0)
    
        pdf_document=fitz.open(stream=pdf_buffer,filetype='pdf')
        

        for i,pages in enumerate(pdf_document.pages()):
            text = pages.get_text()
            if text.strip():
                extracted_documents.append(
                    Document(
                        page_content=text,
                        metadata={"page": i,"type":"text","source":original_name}
                    )
                )
            
            image_list=pages.get_images(full=True)

            for img_index,img in enumerate(image_list):
                xref=img[0]
                base_image=pdf_document.extract_image(xref)
                image_bytes=base_image["image"]
                image_ext=base_image["ext"]

                image_s3_key = f"extracted_images/{object_key}_page_{i}_img_{img_index}.{image_ext}"
                upload_to_s3(image_s3_key,io.BytesIO(image_bytes),f"image/{image_ext}")

                image_caption=await image_caption_generation(image_bytes,image_ext)

                extracted_documents.append(
                    Document(
                        page_content=image_caption,
                        metadata={
                            "page": i,
                            "type": "image",
                            "source": original_name,
                        }
                    )
                )
    except Exception as e:
        logging.exception("PDF document ingestion failed.")
        raise AgentResponseError("PDF document ingestion failed; check the Python service logs.") from e

         
    documents = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=400,
    ).split_documents(extracted_documents)

    for document in documents:
        document.metadata["source"] = original_name
        document.metadata["file_path"] = object_key

    vector_store=await docs_ingestion(documents, COLLECTION_NAME)
    print(vector_store)
    
    return {"indexed": True, "chunks": len(documents)}
