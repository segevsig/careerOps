import requests

OLLAMA_URL = "http://ollama:11434/api/generate"

def ask_llm(prompt: str) -> str:
    try:
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
        data = response.json()
        return data.get("response", "") or ""
    except requests.exceptions.ConnectionError as e:
        raise ValueError(
            "Ollama unreachable. Is Ollama running and is the model 'qwen2.5:7b' pulled? "
            f"(Connection error: {e})"
        ) from e
    except requests.exceptions.Timeout:
        raise ValueError("Ollama request timed out (120s). Try again or use a shorter input.") from None
    except requests.exceptions.HTTPError as e:
        raise ValueError(f"Ollama error ({e.response.status_code}): {e.response.text[:200] if e.response else ''}") from e
