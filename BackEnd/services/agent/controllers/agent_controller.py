import httpx
from ..graph.graph import graph
from fastapi import APIRouter
from pydantic import BaseModel
import os

from dotenv import load_dotenv
from ..config.memory import addMessages
from ..models.MessageModel import MessageModel
load_dotenv()

agent_router=APIRouter()

class AgentRequest(BaseModel):
    prompt: str
    conversation_id: str
    agent: str
    artifacts: list | None = None
    
async def SendMessage(body:AgentRequest, user_id: str):

    prompt=body.prompt
    conversation_id=body.conversation_id
    agent=body.agent
    artifacts=body.artifacts
    
    async with httpx.AsyncClient() as client:

        await addMessages(MessageModel(
            conversation_id=conversation_id,
            prompt=prompt,
            role="user",
            artifacts=artifacts
        ))

        await client.post(f"{os.getenv('CHAT_SERVICE')}/save-message",json={
            "conversation_id":conversation_id,
            "role":"user",
            "content":prompt,
            "artifacts":artifacts
        })

      
        result = await graph.ainvoke({
            "prompt": prompt,
            "conversationID": conversation_id,
            "agent": agent,
            "messages":[],
            "images":[],
            "artifacts":artifacts
        })

        assistant_message = result.get("chat_response", "")
        artifacts=result.get("artifacts",[])
        image_url=result.get("image_url",None)

        credit_response = await client.post(
            f"{os.getenv('AUTH_SERVICE')}/deduct-credit",
            json={"userId": user_id}
        )
        credit_response.raise_for_status()

        await addMessages(MessageModel(
            conversation_id=conversation_id,
            prompt=assistant_message,
            role="assistant",
            artifacts=artifacts,
            image_url=image_url
        ))

        response = await client.post(f"{os.getenv('CHAT_SERVICE')}/save-message",json={
                    "conversation_id":conversation_id,
                    "role":"assistant",
                    "content":assistant_message,
                    "artifacts":artifacts,
                    "image_url":image_url,
        })
        print(response.json())
 
        return {
            "AIMessage": assistant_message,
            "artifacts": artifacts,
            "image_url": image_url,
        }




        
            
 
    
