import base64
import mimetypes
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from ..config.llm_model import getModel
from ..graph.state import AgentState


IMAGE_SYSTEM_PROMPT = """You are an expert visual analysis assistant.
Base every claim only on visible evidence in the supplied image.
If an image detail is unclear or absent, say so explicitly.
Describe objects, layout, colors, text, and relationships accurately.
Answer the user's question directly without mentioning internal tools."""


async def ImageAnayzer(state: AgentState):
    image_artifacts = [
        artifact
        for artifact in state.get("artifacts", [])
        if artifact.get("type") == "image"
    ]
    if not image_artifacts:
        state["chat_response"] = "No image was provided for analysis."
        return state

    content = [{
        "type": "text",
        "text": state.get("prompt", "Analyze this image."),
    }]
    file_paths = []

    try:
        for artifact in image_artifacts:
            file_path = artifact.get("file_path") or artifact.get("path")
            if not file_path:
                continue

            file_paths.append(file_path)
            with open(file_path, "rb") as image_file:
                image_bytes = image_file.read()

            encoded_image = base64.b64encode(image_bytes).decode("utf-8")
            mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"
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
    finally:
        for file_path in file_paths:
            Path(file_path).unlink(missing_ok=True)

    return state