import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from app.core.config import settings

def send_email_sync(to_email: str, subject: str, body: str, html_body: str = None):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"--- MOCK EMAIL TO {to_email} ---")
        print(f"Subject: {subject}")
        print(body)
        print("-------------------------")
        return

    msg = MIMEMultipart('alternative')
    msg['From'] = settings.SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))
    if html_body:
        msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)

async def send_email(to_email: str, subject: str, body: str, html_body: str = None):
    await asyncio.to_thread(send_email_sync, to_email, subject, body, html_body)