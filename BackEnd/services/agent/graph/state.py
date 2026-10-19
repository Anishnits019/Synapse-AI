from typing import Annotated, NotRequired, TypedDict

from langgraph.graph.message import add_messages

class ArtifactField(TypedDict, total=False):
    name: str
    content: str
    language: str
    type: str
    file_path: str
    s3_key: str
    content_type: str

class AgentState(TypedDict):
    prompt: str
    conversationID: str
    agent: str
    messages: NotRequired[Annotated[list, add_messages]]
    chat_response: NotRequired[str]
    search_context: NotRequired[str]
    images: NotRequired[list[str]]
    artifacts: NotRequired[list[ArtifactField]]
    image_url: NotRequired[str | None]
    pdf_path: NotRequired[str | None]
    intent: NotRequired[str]
