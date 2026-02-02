from fastapi import FastAPI
from pydantic import BaseModel
from app.llm import ask_llm

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


class AskRequest(BaseModel):
    prompt: str

@app.post("/ask")
def ask(req: AskRequest):
    answer = ask_llm(req.prompt)
    return {"answer": answer}
