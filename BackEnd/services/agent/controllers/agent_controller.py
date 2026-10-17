import httpx
from ..graph.graph import graph
from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from ..config.memory import addMessages
from ..config.llm_model import getModel
from ..models.MessageModel import MessageModel
load_dotenv()
from ..graph.state import AgentState
from ..config.llm_model import getModel
from ..config.memory import getMemory
from langchain_core.messages import HumanMessage, AIMessage
import json
from pprint import pprint

agent_router=APIRouter()

class AgentRequest(BaseModel):
    prompt: str
    conversation_id: str
    agent: str
    artifacts: list | None = None
    generate_title: bool = False
    
async def SendMessage(body:AgentRequest, user_id: str):

    prompt=body.prompt
    conversation_id=body.conversation_id
    agent=body.agent
    artifacts=body.artifacts

    
    async with httpx.AsyncClient() as client:
        conversation_title = None

        if body.generate_title:
            chat_service = os.getenv("CHAT_SERVICE")
            headers = {"x-user-id": user_id}
            history_response = await client.get(
                f"{chat_service}/get-messages/{conversation_id}",
                headers=headers,
            )
            history_response.raise_for_status()

            if not history_response.json():
                title_response = await getModel("chat").ainvoke(
                    "Create a concise title of at most 6 words for this conversation. "
                    "Return only the title, without quotes or explanation.\n\n"
                    f"First user message: {prompt}"
                )
                raw_title = title_response.content.strip()
                if not raw_title:
                    raise ValueError("The model returned an empty conversation title")
                conversation_title = raw_title.splitlines()[0].strip().strip('"')[:80]
                if not conversation_title:
                    raise ValueError("The model returned an empty conversation title")

                title_update = await client.post(
                    f"{chat_service}/update-conversation",
                    json={
                        "conversation_id": conversation_id,
                        "title": conversation_title,
                    },
                    headers=headers,
                )
                title_update.raise_for_status()

        await addMessages(MessageModel(
            conversation_id=conversation_id,
            role="user",
            content=prompt,
            artifacts=artifacts
        ))

        await client.post(f"{os.getenv('CHAT_SERVICE')}/save-message",json={
            "conversation_id":conversation_id,
            "role":"user",
            "content":prompt,
            "artifacts":artifacts
        })

        
        history=await getMemory(conversation_id)
        messages=[]

        for msg in history:
                  if msg["role"]=="user":
                       messages.append(HumanMessage(content=msg["content"]))
                  elif msg["role"]=="assistant":
                       messages.append(AIMessage(content=msg["content"]))
        if not (
                  isinstance(messages[-1], HumanMessage)
                  and messages[-1].content == prompt
             ):
            messages.append(HumanMessage(content=prompt))
    
        result = await graph.ainvoke({
            "prompt": prompt,
            "conversationID": conversation_id,
            "agent": agent,
            "messages":messages,
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
            role="assistant",
            content=assistant_message,
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
      
        return {
            "AIMessage": assistant_message,
            "artifacts": artifacts,
            "image_url": image_url,
            "conversation_title": conversation_title,
        }




        
            
 
    
