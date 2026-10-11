import os
from pathlib import Path
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())
from langchain_google_genai import GoogleGenerativeAIEmbeddings

google_api_key = os.getenv("GOOGLE_API_KEY") 

embeddings = GoogleGenerativeAIEmbeddings(
	model="gemini-embedding-2-preview",
	google_api_key=google_api_key,
)




