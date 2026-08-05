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


class SprintInsightsRequest(BaseModel):
    member_names: Optional[dict[str, str]] = None


class SprintInsightsResponse(BaseModel):
    insights: str
