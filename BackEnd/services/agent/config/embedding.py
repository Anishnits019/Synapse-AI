import os
from pathlib import Path
from dotenv import find_dotenv, load_dotenv
load_dotenv(find_dotenv())

from langchain_cohere import CohereEmbeddings

cohere_api_key = os.getenv("COHERE_API_KEY") 

embeddings = CohereEmbeddings(
    model="embed-english-v3.0",  # Or "embed-multilingual-v3.0" depending on your documents
    cohere_api_key=cohere_api_key,
)