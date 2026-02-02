"""
Task handlers for AI service.
Each task receives params from the Node backend and returns a structured result.
"""
import json
import re
from typing import Any

from app.llm import ask_llm


def task_cover_letter(params: dict[str, Any]) -> dict[str, Any]:
    """Generate a cover letter from cvText, jobDescription, and optional tone."""
    cv_text = params.get("cvText", "") or params.get("cv_text", "")
    job_description = params.get("jobDescription", "") or params.get("job_description", "")
    tone = params.get("tone", "professional")

    prompt = f"""
You are a professional career coach.
Generate a cover letter in a {tone} tone.
The cover letter needs to be short and precise for the job: 4-5 lines.
Include a little information about the submitter.

CV:
{cv_text}

Job Description:
{job_description}

Cover Letter:
"""
    answer = ask_llm(prompt)
    return {"result": answer or ""}


def task_resume_scoring(params: dict[str, Any]) -> dict[str, Any]:
    """Score resume against job description; return score, strengths, gaps, suggestions."""
    cv_text = params.get("cvText", "") or params.get("cv_text", "")
    job_description = params.get("jobDescription", "") or params.get("job_description", "")

    prompt = """
You are a careful, honest career coach and resume analyst.

You are given:
- A candidate resume (CV) text.
- A job description.

Your job:
- Evaluate how well the **actual written CV** matches the job description.
- **Do NOT invent or assume experience, skills, education or achievements that are not explicitly present in the CV text.**
- If the job description requires something that is not clearly mentioned in the CV, treat it as **missing** (a gap), even if it might be realistic that the candidate has it.
- Focus on what is truly written.

Scoring rules:
- Return an integer score between 0 and 100 (inclusive).
- Higher score = stronger match between the written CV and the job description.
- Consider role requirements, years of experience, skills/tech stack, domain knowledge, and responsibilities **only as they appear in the CV**.

Output format:
- You MUST return a strict JSON object with this exact shape:
{
  "score": number,
  "strengths": [
    { "title": string, "description": string },
    { "title": string, "description": string },
    { "title": string, "description": string }
  ],
  "gaps": [
    { "title": string, "description": string },
    { "title": string, "description": string },
    { "title": string, "description": string }
  ],
  "suggestions": string[]
}

Constraints:
- Provide **exactly 3** strengths and **exactly 3** gaps.
- For gaps, explain clearly what is missing in the CV compared to the job description.
- In suggestions, focus on **how to rewrite or reorganize the CV** and **what to explicitly mention** based ONLY on the candidate's real experience as written.
- Never phrase anything as if the candidate already has experience that does not exist in the CV.

Now analyze:

CV:
=======
""" + cv_text + """
=======

Job Description:
=======
""" + job_description + """
=======

Return only the JSON object, with no extra text or explanation.
"""
    content = ask_llm(prompt)
    if not content or not isinstance(content, str):
        raise ValueError("Empty response from LLM")

    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    data = json.loads(raw)

    score = data.get("score", 0)
    if not isinstance(score, (int, float)):
        raise ValueError("AI response is missing a numeric score")
    score = max(0, min(100, round(score)))

    strengths = data.get("strengths", [])
    if not isinstance(strengths, list):
        strengths = []
    strengths = [
        {"title": item.get("title", "Strength"), "description": item.get("description", "")}
        for item in strengths[:3]
    ]

    gaps = data.get("gaps", [])
    if not isinstance(gaps, list):
        gaps = []
    gaps = [
        {"title": item.get("title", "Gap"), "description": item.get("description", "")}
        for item in gaps[:3]
    ]

    suggestions = data.get("suggestions", [])
    if not isinstance(suggestions, list):
        suggestions = []
    suggestions = [s for s in suggestions if isinstance(s, str)]

    return {
        "score": score,
        "strengths": strengths,
        "gaps": gaps,
        "suggestions": suggestions,
    }


def task_default(task: str, params: dict[str, Any]) -> dict[str, Any]:
    """Handle unknown tasks: return error info."""
    return {
        "error": True,
        "message": f"Unknown task: {task}",
        "task": task,
    }


# Registry: task name -> (handler function, expects_params_keys)
TASK_HANDLERS = {
    "cover_letter": (task_cover_letter, ["cvText", "jobDescription"]),
    "resume_scoring": (task_resume_scoring, ["cvText", "jobDescription"]),
}


def run_task(task: str, params: dict[str, Any]) -> dict[str, Any]:
    """Dispatch to the right task handler or default."""
    if task in TASK_HANDLERS:
        handler, _ = TASK_HANDLERS[task]
        return handler(params)
    return task_default(task, params)
