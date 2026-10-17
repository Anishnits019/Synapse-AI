from pydantic import BaseModel

class MessageModel(BaseModel):
    conversation_id: str
    role: str
    content: str
    artifacts: list | None = None
    image_url: str | None = None
 