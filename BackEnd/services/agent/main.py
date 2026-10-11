from fastapi import FastAPI
from .routes.agentRoute import agent_router
from dotenv import load_dotenv
load_dotenv()  #
app = FastAPI()

app.include_router(agent_router)
