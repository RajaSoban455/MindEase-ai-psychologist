from groq import Groq
from app.prompt import SYSTEM_PROMPT
from dotenv import load_dotenv
import os

load_dotenv()
client = Groq(api_key= os.getenv("GROQ_API_KEY"))

def get_ai_response(chat_history: list) -> str:
    """
    chat_history ek list hai jaise:
    [{"role": "user", "content": "Mujhe anxiety ho rahi hai"},
     {"role": "assistant", "content": "..."}]
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + chat_history
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=500
    )
    return response.choices[0].message.content