import json
from groq import AsyncGroq
from app.core.config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"


async def generate_subtasks(title: str, description: str | None = None) -> list[str]:
    desc_text = description if description else ""

    response = await client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful project management assistant.\n"
                    "Generate 3-6 actionable subtasks for the given task.\n"
                    "LINGUISTIC PURITY & SMART MIRRORING RULE:\n"
                    "1. Automatically detect the primary language of the title and description.\n"
                    "2. Generate all subtasks STRICTLY in that identified language with 100% linguistic purity.\n"
                    "3. Do not mix languages within sentences. If writing in Russian, use clean Russian terms without substituting English words or symbols. If writing in English, maintain consistent professional English.\n"
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
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert tech lead and editor. Rewrite and structure user notes into a compact, highly legible Markdown task description.\n\n"
                    "LINGUISTIC PURITY & SMART MIRRORING RULES:\n"
                    "1. Identify the dominant language of the input text (e.g. Russian, English, etc.). Respond STRICTLY and ENTIRELY in that same language.\n"
                    "2. ZERO LANGUAGE MIXING: Do not blend English words into Russian sentences or vice versa. Maintain absolute linguistic purity and correct grammar.\n"
                    "3. Keep wording CONCISE, clean, and fast to read in under 5 seconds. Avoid verbose phrasing.\n\n"
                    "FORMATTING STRUCTURE (adapt headings to the detected language):\n"
                    "- If Russian is detected, use exact headings: '### 📌 Суть задачи' (overview) and '### 🎯 Что нужно сделать' (bulleted steps: - **Шаг:** описание).\n"
                    "- If English or any other language is detected, translate these headings naturally (e.g. for English: '### 📌 Task Overview' and '### 🎯 Actionable Steps' with bulleted items: - **Step:** details).\n\n"
                    "HANDLING UNCLEAR OR RANDOM INPUT:\n"
                    "- If input is gibberish typed with a Russian keyboard or Cyrillic characters, output this clean Russian template:\n"
                    "  > 💡 **Подсказка:** Текст похож на опечатки или черновик. Заполните шаблон ниже:\n\n"
                    "  ### 📌 Суть задачи\n"
                    "  - **Цель:** Кратко опишите, что нужно сделать.\n\n"
                    "  ### 🎯 Что нужно сделать\n"
                    "  - **Шаг 1:** Основное действие или изменение.\n"
                    "  - **Шаг 2:** Проверка работоспособности.\n\n"
                    "- If input is gibberish typed in Latin alphabet/English, output an equivalent clean English template:\n"
                    "  > 💡 **Tip:** The input appears incomplete or unformatted. Use this quick template:\n\n"
                    "  ### 📌 Task Overview\n"
                    "  - **Goal:** Briefly define what needs to be accomplished.\n\n"
                    "  ### 🎯 Actionable Steps\n"
                    "  - **Step 1:** Primary action or implementation detail.\n"
                    "  - **Step 2:** Verification and testing.\n\n"
                    "Output directly in clean Markdown without introductory or concluding chatter."
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
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert AI Scrum Master, Agile Coach, and Technical Project Analyst for TaskPulse. "
                    "Your objective is to provide an executive sprint summary, evaluate risk, and optimize team throughput based on provided organization data.\n\n"
                    "LINGUISTIC PURITY & SMART MIRRORING RULES:\n"
                    "1. Analyze the task titles and content in the provided data to detect the team's primary working language (e.g. Russian or English).\n"
                    "2. Respond ENTIRELY in that detected language with 100% linguistic purity. Never mix languages, translation calques, or foreign characters (e.g. in Russian never write '瓶neck' or English slang; always use accurate terms like 'узкие места' and 'проблемные зоны').\n"
                    "3. Maintain a professional, crisp tech-lead voice.\n\n"
                    "STRUCTURE & HEADINGS (adapt strictly to the detected team language):\n"
                    "- If the team's working language is Russian, use exactly these Markdown headings:\n"
                    "  ### 📊 Общее состояние спринта\n"
                    "  ### ⚠️ Узкие места и риски\n"
                    "  ### 💡 Рекомендации скрам-мастера\n\n"
                    "- If the team's working language is English (or any other international language), use exactly these Markdown headings:\n"
                    "  ### 📊 Sprint Health & Progress\n"
                    "  ### ⚠️ Bottlenecks & Risks\n"
                    "  ### 💡 Scrum Master Recommendations\n\n"
                    "CONTENT REQUIREMENTS UNDER EACH HEADING:\n"
                    "- Under the first heading: Provide an overall progress summary, calculate an estimated Sprint Health score (out of 100%), and comment on throughput.\n"
                    "- Under the second heading: Analyze stalled tasks, overdue items, priority bottlenecks, or workload imbalance across team members. Use clean bullet points.\n"
                    "- Under the third heading: Provide 3-4 concrete, actionable steps to balance workloads, unblock critical path items, and secure deadline adherence.\n\n"
                    "Do not include conversational filler or introductory chatter outside the Markdown structure. Reference exact human names from data."
                )
            },
            {
                "role": "user",
                "content": f"Team and sprint statistics data:\n{stats_summary}"
            }
        ]
    )
    return response.choices[0].message.content
