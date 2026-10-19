import base64
import binascii
import io
import os
import uuid

import httpx
from dotenv import find_dotenv, load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage

from ..config.llm_model import getModel
from ..exception import (
    AgentError,
    AgentExecutionError,
    AgentInputError,
    AgentResponseError,
)
from ..graph.state import AgentState
from ..logger import logging
from ..utils.getFromS3 import get_from_s3
from ..utils.uploadTos3 import upload_to_s3

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)

QUERY_IMPROVE_PROMPT = """
You are an expert AI Image Prompt Engineer specializing in generative visual models.

Transform the user's request into a detailed but concise prompt. Specify the subject
and action, style, composition, environment, lighting, colors, and visual details
where relevant.

Output only the final image prompt, without explanations, markdown, or quotes.
"""

MODEL = "@cf/black-forest-labs/flux-1-schnell"


async def imageGenAgent(state: AgentState):
    logger.info("Image generation agent execution started")
    try:
        account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
        api_token = os.getenv("CLOUDFLARE_API_TOKEN")
        if not account_id or not api_token:
            raise AgentInputError(
                "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be configured"
            )

        prompt = state.get("prompt", "")
        if not prompt:
            raise AgentInputError("An image generation prompt is required")

        llm = getModel("chat")
        prompt_response = await llm.ainvoke([
            SystemMessage(content=QUERY_IMPROVE_PROMPT),
            HumanMessage(content=prompt),
        ])
        image_prompt = getattr(prompt_response, "content", "").strip()
        if not image_prompt:
            raise AgentResponseError(
                "The image prompt model returned an empty prompt"
            )

        url = (
            f"https://api.cloudflare.com/client/v4/accounts/{account_id}"
            f"/ai/run/{MODEL}"
        )
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={"prompt": image_prompt},
            )
            response.raise_for_status()

        try:
            data = response.json()
        except ValueError as error:
            raise AgentResponseError(
                "Cloudflare returned invalid JSON for image generation"
            ) from error

        if not isinstance(data, dict) or not isinstance(data.get("result"), dict):
            raise AgentResponseError(
                "Cloudflare returned an invalid image generation response"
            )
        image_base64 = data["result"].get("image")
        if not image_base64:
            raise AgentResponseError(
                "Cloudflare response did not contain image data"
            )

        try:
            image_bytes = base64.b64decode(image_base64, validate=True)
        except (binascii.Error, ValueError) as error:
            raise AgentResponseError(
                "Cloudflare returned invalid base64 image data"
            ) from error

        filename = f"generated_images/{uuid.uuid4()}.jpg"
        object_key = upload_to_s3(
            filename,
            io.BytesIO(image_bytes),
            "image/jpeg",
        )
        image_url = get_from_s3(object_key, expires_in=3600)
        if not image_url:
            raise AgentExecutionError(
                "Generated image was uploaded but could not be retrieved"
            )

        state["chat_response"] = "Generated image successfully based on your prompt."
        state["artifacts"] = [{
            "name": filename,
            "file_path": image_url,
        }]
        logger.info("Image generation agent completed successfully")
        return state
    except AgentError:
        logger.exception("Image generation agent failed")
        raise
    except (httpx.HTTPError, OSError) as error:
        logger.exception("Image generation agent failed")
        raise AgentExecutionError(
            "Image generation failed while calling or storing the image"
        ) from error
    except Exception as error:
        logger.exception("Image generation agent failed")
        raise AgentExecutionError(
            "Image generation agent failed to process the request"
        ) from error
