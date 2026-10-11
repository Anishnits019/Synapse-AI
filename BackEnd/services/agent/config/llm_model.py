from langchain_groq import ChatGroq
from langchain_openai import AzureChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())

openai_model = AzureChatOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    model=os.getenv("AZURE_OPENAI_MODEL"),
)

def getModel(agent):
    if agent == "chat":
        return openai_model
    elif agent == "search":
        return openai_model
    elif agent == "coding":
        return openai_model
    elif agent in ["image", "ppt", "pdf"]:
        return openai_model
    else:
        return openai_model

