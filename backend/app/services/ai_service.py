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


async def generate_sprint_insights(stats_summary: str) -> str:
    response = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert AI Scrum Master, Agile Coach, and Technical Project Analyst for TaskPulse. "
                    "Your objective is to provide an executive sprint summary, evaluate risk, and optimize team throughput based on provided organization data.\n\n"
                    "RULES FOR FORMATTING AND TONE:\n"
                    "1. Always respond in clean, highly structured Russian with a professional, sharp tech lead voice.\n"
                    "2. CRITICAL LANGUAGE RULE: Never use literal translation calques or non-Cyrillic foreign symbols (e.g. NEVER use '瓶neck', always write 'узкие места' or 'проблемные зоны'). All Russian words must be written in standard Cyrillic typography without mixing Asian characters.\n"
                    "3. Structure your response directly into Markdown using exactly these headings:\n"
                    "   ### 📊 Общее состояние спринта\n"
                    "   Provide an overall progress summary, calculate an estimated Sprint Health score (out of 100%), and comment on throughput.\n\n"
                    "   ### ⚠️ Узкие места и риски\n"
                    "   Analyze stalled tasks, overdue items, priority bottlenecks, or workload imbalance across team members. Use clean bullet points.\n\n"
                    "   ### 💡 Рекомендации скрам-мастера\n"
                    "   Provide 3-4 concrete, actionable steps to balance workloads, unblock critical path items, and secure deadline adherence.\n\n"
                    "4. Do not include introductory conversational filler or concluding chatter outside the Markdown structure. Use exact human names from data."
                )
            },
            {
                "role": "user",
                "content": f"Team and sprint statistics data:\n{stats_summary}"
            }
        ]
    )
    return response.choices[0].message.content
