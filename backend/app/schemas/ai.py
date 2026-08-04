from pydantic import BaseModel
from typing import Optional


class GenerateSubtasksRequest(BaseModel):
    title: str
    description: Optional[str] = None

class GenerateSubtasksResponse(BaseModel):
    subtasks: list[str]


class ImproveTextRequest(BaseModel):
    text: str

class ImproveTextResponse(BaseModel):
    improved_text: str
