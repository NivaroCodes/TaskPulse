import json
from groq import AsyncGroq
from app.core.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"


async def generate_subtasks(title: str, description: str | None = None) -> list[str]:
    desc_text = description if description else ""

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.5,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful project management assistant. "
                    "Generate 3-6 actionable subtasks for the given task. "
                    "Always generate subtasks in the SAME language as the task title and description (default to Russian if typing style or context is Russian). "
                    "Respond ONLY with a valid JSON object containing a single key 'subtasks' which is a list of strings."
                )
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
        temperature=0.4,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert tech lead and editor. Rewrite and structure user notes into a compact, highly legible Markdown task description.\n\n"
                    "RULES FOR FORMATTING:\n"
                    "1. Always respond in the SAME LANGUAGE as user input (default to Russian for Russian layouts).\n"
                    "2. Keep wording CONCISE, clean, and fast to read in under 5 seconds. Avoid verbose phrasing or heavy water words.\n"
                    "3. For valid notes, format cleanly:\n"
                    "   - '### 📌 Суть задачи' for a brief 1-2 sentence overview.\n"
                    "   - '### 🎯 Что нужно сделать' for short bulleted steps (- **Шаг:** описание).\n"
                    "4. HANDLING UNCLEAR OR RANDOM INPUT:\n"
                    "   If the input is gibberish or random letters (e.g., 'wyvwfy', 'test', 'вывфыфывфывфы'), output this compact Russian template without scolding:\n\n"
                    "   > 💡 **Подсказка:** Текст похож на опечатки или черновик. Заполните шаблон ниже:\n\n"
                    "   ### 📌 Суть задачи\n"
                    "   - **Цель:** Кратко опишите, что нужно сделать.\n\n"
                    "   ### 🎯 Что нужно сделать\n"
                    "   - **Шаг 1:** Основное действие или изменение.\n"
                    "   - **Шаг 2:** Проверка работоспособности.\n\n"
                    "5. Output directly in clean Markdown without any intro/outro chatter."
                )
            },
            {
                "role": "user",
                "content": f"Raw notes to improve or format: {text}"
            }
        ]
    )

    result_text = response.choices[0].message.content
    return result_text
