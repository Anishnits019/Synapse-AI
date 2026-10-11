from urllib.parse import quote
import uuid
import requests
import boto3
import os
from ..utils.uploadTos3 import upload_to_s3
from ..graph.state import AgentState
from ..config.llm_model import getModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
import urllib.parse

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1"),
)

def imageGenAgent(state:AgentState):
     llm =getModel("chat")
     query_improve_prompt = """
You are an expert AI Image Prompt Engineer specializing in generative visual models (Midjourney, Stable Diffusion, DALL-E 3).

YOUR TASK:
Transform raw, vague, or simple user inputs into highly detailed, visually rich, and precise image generation prompts.

ENHANCEMENT FRAMEWORK:
When expanding a user prompt, enrich it by explicitly defining the following dimensions (if applicable):
1. Subject & Action: Clear, detailed description of the core subjects, posture, and expressions.
2. Art Style & Medium: Photorealistic (specify camera lens, lighting type, film stock) or Artistic (e.g., oil painting, digital art, cyberpunk, watercolor).
3. Composition & Framing: Camera angle (e.g., wide shot, macro, cinematic low angle, depth of field).
4. Environment & Background: Specific setting details, atmosphere, weather, and time of day.
5. Lighting & Color Palette: Key lighting (e.g., volumetric rays, golden hour, moody chiaroscuro, neon glow) and dominant color schemes.
6. Details & Rendering Quality: Micro-textures, high definition, sub-surface scattering, highly detailed.

STRICT OUTPUT RULES:
- Output ONLY the final enhanced prompt text.
- Do NOT include intros, explanations, markdown commentary, or quotes.
- Keep the language descriptive, evocative, and concise.
"""
     response = llm.invoke([
            SystemMessage(content=query_improve_prompt),
            HumanMessage(content=state["prompt"]),
       ])
     image_gen_prompt = getattr(response, "content", "").strip()

     encoded_prompt = urllib.parse.quote(image_gen_prompt)

# Default free model (Flux)

     pollinations_url = f"https://image.pollinations.ai/prompt/{quote(encoded_prompt)}?model=flux&nologo=true"
     response = requests.get(pollinations_url, timeout=120)
     print(response.status_code)
     
    #  // It is the buffer of image we get as rwa data which we have passed into the upload_to_w3 which give the 
     print(f"Pollinations status: {response.status_code}", flush=True)

     file_key = f"generated_images/{uuid.uuid4()}.jpg"
     print(file_key)

     s3_url=upload_to_s3(file_key,response.content,"image/jpeg")
     print(s3_url)

     state["image_url"]=s3_url
     state["chat_response"] = "Generated image successfully based on your prompt."

     return state





     

