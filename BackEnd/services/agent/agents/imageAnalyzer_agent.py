import base64
import mimetypes

from langchain_core.messages import HumanMessage, SystemMessage

from ..config.llm_model import getModel
from ..exception import AgentError, AgentExecutionError, AgentInputError
from ..graph.state import AgentState
from ..logger import logging
from ..utils.getFromS3 import download_from_s3


IMAGE_SYSTEM_PROMPT = """You are an expert visual analysis assistant.
Base every claim only on visible evidence in the supplied image.
If an image detail is unclear or absent, say so explicitly.
Describe objects, layout, colors, text, and relationships accurately.
Answer the user's question directly without mentioning internal tools."""

logger = logging.getLogger(__name__)


async def ImageAnayzer(state: AgentState):
    logger.info("Image analysis agent execution started")
    try:
        image_artifacts = [
            artifact
            for artifact in state.get("artifacts", [])
            if artifact.get("type") == "image"
        ]
        if not image_artifacts:
            state["chat_response"] = "No image was provided for analysis."
            logger.info("Image analysis skipped because no image was provided")
            return state

        content = [{
            "type": "text",
            "text": state.get("prompt", "Analyze this image."),
        }]

        for artifact in image_artifacts:
            s3_key = artifact.get("s3_key")
            if not s3_key:
                raise AgentInputError(
                    f"Image artifact {artifact.get('name', '<unnamed>')} has no S3 key"
                )

            image_bytes = download_from_s3(s3_key)
            encoded_image = base64.b64encode(image_bytes).decode("utf-8")
            mime_type = (
                artifact.get("content_type")
                or mimetypes.guess_type(artifact.get("name") or "")[0]
                or "image/jpeg"
            )
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{encoded_image}"
                },
            })

        response = await getModel("image_analyzer").ainvoke([
            SystemMessage(content=IMAGE_SYSTEM_PROMPT),
            HumanMessage(content=content),
        ])
        state["chat_response"] = getattr(response, "content", "").strip()
        logger.info("Image analysis agent completed successfully")
        return state
    except AgentError:
        logger.exception("Image analysis agent failed")
        raise
    except Exception as error:
        logger.exception("Image analysis agent failed")
        raise AgentExecutionError(
            "Image analysis agent failed to process the request"
        ) from error