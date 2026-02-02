import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.llm import ask_llm
from app.tasks import run_task

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


class TaskRequest(BaseModel):
    task: str
    params: dict = {}


@app.post("/task")
def task(req: TaskRequest):
    """Run an AI task by name. Params are passed through to the task handler."""
    if not req.task or not req.task.strip():
        raise HTTPException(status_code=400, detail="task is required")
    try:
        result = run_task(req.task.strip(), req.params or {})
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result.get("message", "Task failed"))
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON from LLM: {e}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"AI task failed: {getattr(e, 'message', str(e))}",
        ) from e
