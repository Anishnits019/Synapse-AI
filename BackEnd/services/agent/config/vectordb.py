import os
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())
from .embedding import embeddings
from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore


url = os.getenv("QDRANT_END_POINT")
api_key = os.getenv("QDRANT_API_KEY")

client = QdrantClient(url=url, api_key=api_key, prefer_grpc=True)  # one shared client
COLLECTION_NAME = "my_documents_cohere_1024"


async def docs_ingestion(docs, collection_name=COLLECTION_NAME):
        print("qdrant reached")

        vector_store = QdrantVectorStore.from_documents(
        documents=docs,
        embedding=embeddings,
        url=url,
        api_key=api_key,
        collection_name=collection_name,
        force_recreate=True,  # remove after first successful run

    )

    
def get_vector_store(collection_name=COLLECTION_NAME):
    return QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
    )

async def search_documents(query, collection_name=COLLECTION_NAME, limit=5):
    return get_vector_store(collection_name).similarity_search(query, k=limit)



     

