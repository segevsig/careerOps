import requests

OLLAMA_URL = "http://ollama:11434/api/generate"

def ask_llm(prompt: str) -> str:
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )
    response.raise_for_status()
    return response.json()["response"]
