import httpx
import os

async def getMessages (conversation_id:str):
    conversation_id=conversation_id

    async with  httpx.AsyncClient() as client:
     
     response=await client.get(f"{os.getenv('CHAT_SERVICE')}/get-messages/{conversation_id}")
     response.raise_for_status()
    return response.json()

     




