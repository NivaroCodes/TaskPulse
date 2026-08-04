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
                    "You are an expert team lead and technical writer. Your goal is to rewrite and format user notes into a clean, highly readable, and professional Markdown task description.\n\n"
                    "RULES FOR FORMATTING:\n"
                    "1. Always respond in the SAME LANGUAGE as the user input (default to Russian if ambiguous or if characters belong to a Russian keyboard layout).\n"
                    "2. For valid notes, structure them cleanly using Markdown:\n"
                    "   - Use '### 📌 Обзор задачи' for a concise executive summary.\n"
                    "   - Use '### 🎯 Детали и требования' for bulleted actionable steps or specifications.\n"
                    "   - Highlight dates, terminology, or key milestones in **bold**.\n"
                    "3. HANDLING UNCLEAR OR RANDOM INPUT:\n"
                    "   If the input is short, gibberish, or random characters (e.g., 'wyvwfy', 'test', '123', 'вывфыфывфывфы'), NEVER display an English error or rebuke the user. Instead, output this friendly, beautifully formatted Russian template:\n\n"
                    "   > 💡 **Подсказка от ИИ:** Введенный текст пока похож на черновик или набор случайных символов. Ниже подготовлен удобный структурированный шаблон для быстрого оформления задачи:\n\n"
                    "   ### 📌 Обзор задачи\n"
                    "   - **Описание:** Краткая суть того, что требуется сделать и какого результата необходимо достичь.\n\n"
                    "   ### 🎯 Ключевые требования и детали\n"
                    "   - **Шаг 1:** Основные этапы реализации, настройки или тестирования.\n"
                    "   - **Шаг 2:** Используемые технологии, ссылки на документацию, макеты или зависимости.\n\n"
                    "   ### ✅ Критерии готовности (DoD)\n"
                    "   - **Проверка:** Как убедиться, что задача успешно выполнена (тесты, ревью, деплой).\n\n"
                    "   ---\n"
                    "   *✨ Замените пункты шаблона на свои тезисы или напишите пару черновых строк и снова нажмите кнопку AI Polish!*\n\n"
                    "4. Do NOT include conversational filler, introductory banter, or meta-commentary outside the Markdown."
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