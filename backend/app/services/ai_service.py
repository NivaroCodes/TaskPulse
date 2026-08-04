import json
from groq import AsyncGroq
from app.core.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"


async def generate_subtasks(title: str, description: str | None = None) -> list[str]:
    desc_text = description if description else ""

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "You are a helpful project management assistant."
                           "Generate 3-6 actionable subtasks for the given task."
                           "Respond ONLY with a valid JSON object containing a single key 'subtasks' which is a list of strings."
            },
            {
                "role": "user",
                "content": f"Title: {title}\nDescription: {desc_text}"
            }
        ]
    )

    result_text = response.choices[0].message.content
    data = json.loads(result_text)
    return data.get("subtasks", [])

async def improve_text(text: str) -> str:
    response = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical editor and communicator."
                           "Fix grammatical errors, make the text clear, professional, and concise using Markdown formatting if appropriate."
                           "Do NOT add conversational introductory or concluding phrases, simply return the improved text."
            },
            {
                "role": "user",

                "content": f"Usertext: {text}"
            }
        ]
    )

    result_text = response.choices[0].message.content
    return result_text