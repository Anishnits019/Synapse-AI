import os
import uuid
import httpx
from langchain_core.messages import HumanMessage, SystemMessage
import requests
from ..config.llm_model import getModel
from ..graph.state import AgentState
from ..utils.getFromS3 import get_from_s3
from ..utils.uploadTos3 import upload_to_s3
from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())
import base64
import io 

QUERY_IMPROVE_PROMPT = """
You are an expert AI Image Prompt Engineer specializing in generative visual models.

Transform the user's request into a detailed but concise prompt. Specify the subject
and action, style, composition, environment, lighting, colors, and visual details
where relevant.

Output only the final image prompt, without explanations, markdown, or quotes.
"""

MODEL = "@cf/black-forest-labs/flux-1-schnell"


async def imageGenAgent(state: AgentState):
    
     account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
     api_token = os.getenv("CLOUDFLARE_API_TOKEN")

     if not account_id or not api_token:
        raise RuntimeError(
            "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be configured"
        )

     llm = getModel("chat")
     prompt_response = await llm.ainvoke([
        SystemMessage(content=QUERY_IMPROVE_PROMPT),
        HumanMessage(content=state["prompt"]),
    ])
     image_prompt = getattr(prompt_response, "content", "").strip()
     if not image_prompt:
        raise ValueError("The image prompt model returned an empty prompt")

     url = (
         f"https://api.cloudflare.com/client/v4/accounts/{account_id}"
        f"/ai/run/{MODEL}"
    )
     headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }
     payload={
        "prompt":image_prompt
    }
     response = requests.post(url, headers=headers, json=payload)
   
     if not  response.status_code == 200:
       raise ValueError(
           f"Cloudflare API failed with status {response.status_code}: {response.text}"
     )

     data = response.json()
    
     image_base64 = data.get("result", {}).get("image")
    
     if not image_base64:
        raise ValueError(f"Cloudflare response did not contain image data: {data}")
        
     image_buffer = io.BytesIO(base64.b64decode(image_base64))
     # Default to .jpg for Cloudflare image generation models
     
     extension = ".jpg"
     content_type = "image/jpeg"

     if not extension or not response.content:
        raise ValueError(
            "Cloudflare returned an invalid image response "
            f"(content type: {content_type or 'unknown'})"
        )

     filename = f"generated_images/{uuid.uuid4()}{extension}"
     object_key = upload_to_s3(filename, image_buffer, content_type)
     image_url = get_from_s3(object_key, expires_in=3600)

     print(image_url)

     if not image_url:
        raise RuntimeError("Uploaded image could not be retrieved from S3")

     state["chat_response"] = "Generated image successfully based on your prompt."
     state["artifacts"] = [{
        "name": filename,
        "file_path": image_url,
    }]

     return state
