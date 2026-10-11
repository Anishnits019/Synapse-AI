from pydantic import BaseModel
from ..utils  import getMessages
from .redis import redis_client
import json

class conversationdModel(BaseModel):
    conversation_id:str

class MessageModel(BaseModel):
    conversation_id:str
    prompt:str
    role:str
    image_url:str=None

async def getMemory(convo_id: str):

     redis_key =f"converstion:{convo_id}"

     exists =await redis_client.exists(redis_key)

     if exists:
          cached_data=await redis_client.hget(redis_key,"messages")
        #  Redis stores data into serializable format so when we want python object return we have to use json.loads
          return json.loads(cached_data) if cached_data else []
     
     messages =await getMessages(convo_id) 
     #here messages is a dict object not a json object because it is called as a function 

     await redis_client.hset(
       redis_key,
       "messages",
       json.dumps(messages),

        # Redis stores data into serializable format so when we want tp store  python object  we have to use json.dumps
     )
     return messages

async def addMessages(body:MessageModel):
     
           convo_id=body.conversation_id
           content=body.prompt
           role=body.role
           image_url=body.image_url

           redis_key =f"converstion:{convo_id}"

           rawMessages=await redis_client.hget(redis_key,"messages")
           messages=json.loads(rawMessages) if rawMessages else []

           messages.append({
                 "converstaionID":convo_id,
                 "role":role,
                 "content":content,
                 "image_url":image_url
           })
           if len(messages)>20:
                 messages = messages[-20:]

           await redis_client.hset(
                 redis_key,
                 "messages",
                 json.dumps(messages),
            )
           return messages







