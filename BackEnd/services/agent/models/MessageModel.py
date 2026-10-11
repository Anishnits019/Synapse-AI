from pydantic import BaseModel


class MessageModel(BaseModel):
    conversation_id: str
    prompt: str
    role: str
    artifacts: list | None = None
    image_url: str | None = None