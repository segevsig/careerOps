# CareerOps

A system to help you manage your entire job search process.

## Features

- ✅ PostgreSQL database
- ✅ User authentication (register, login, forgot password, reset password)
- ✅ Personal dashboard with stats and job applications
- ✅ **Job applications** – Add, edit, delete applications; track status (applied, interview, offer, rejected)
- ✅ **AI Tools** (full-page flows, not modals):
  - **Generate Cover Letter** – AI cover letter from your CV and job description (async via queue + worker)
  - **Resume Scoring** – AI analysis of how well your resume matches a job description (score, strengths, gaps, suggestions)
- ✅ **AI service** – Python FastAPI service with task-based API; one handler per task (e.g. `cover_letter`, `resume_scoring`) and default for unknown tasks
- ✅ **Worker** – Node.js worker consumes cover-letter jobs from RabbitMQ and calls the ai-service
- ✅ RabbitMQ for async cover letter jobs
- ✅ Ollama (local LLM) – ai-service uses `qwen2.5:7b` for cover letter and resume scoring

## Installation and Running

### Prerequisites

- Docker and Docker Compose
- (Optional) For AI tools: enough resources for Ollama and the model (~4GB+ for `qwen2.5:7b`)

### Running with Docker Compose

1. Clone the project:
   ```bash
   git clone <repository-url>
   cd CareerOps
   ```

2. Run all services:
   ```bash
   docker compose up --build
   ```

3. **Pull the Ollama model** (required for AI tools). In another terminal, once Ollama is up:
   ```bash
   docker exec -it ollama ollama pull qwen2.5:7b
   ```

4. Open in your browser:
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:3000
   - **AI service:** http://localhost:8000 (health: http://localhost:8000/health)
   - **RabbitMQ management:** http://localhost:15672 (login: `careerops` / `careerops`)

### Services (Docker Compose)

| Service     | Port(s)        | Description                                      |
|------------|----------------|---------------------------------------------------|
| frontend   | 5173           | React + Vite                                     |
| backend    | 3000           | Express API; auth, applications, cover-letter, resume-scoring |
| ai-service | 8000           | Python FastAPI; runs AI tasks (cover_letter, resume_scoring) |
| ollama     | 11434          | Local LLM (qwen2.5:7b)                            |
| db         | 5432           | PostgreSQL                                       |
| rabbitmq   | 5672, 15672     | Message queue (worker consumes cover-letter jobs) |
| worker     | —              | Processes cover-letter jobs, calls ai-service   |

**If you get "Failed to score resume" or 404 from the AI:** Rebuild and restart the ai-service so it has the `/task` endpoint:
```bash
docker compose build ai-service --no-cache
docker compose up -d ai-service
```

## AI Tools Architecture

- **Frontend** sends CV text, job description, and (for cover letter) tone to the **backend**.
- **Backend** does **not** build prompts. It sends to the **ai-service** only:
  - **task** – e.g. `cover_letter` or `resume_scoring`
  - **params** – e.g. `{ cvText, jobDescription, tone }`
- **ai-service** (Python):
  - Single endpoint: `POST /task` with body `{ "task": "cover_letter" | "resume_scoring", "params": { ... } }`
  - One function per task in `app/tasks.py` (e.g. `task_cover_letter`, `task_resume_scoring`)
  - Unknown tasks return a default error response
  - Uses Ollama (`qwen2.5:7b`) via `app/llm.py`

**Cover letter** is async: backend enqueues a job (RabbitMQ), worker picks it up and calls ai-service with `task: "cover_letter"`. **Resume scoring** is synchronous: backend calls ai-service with `task: "resume_scoring"` and returns the result.

## AI Tools in the UI

- From the **Dashboard**, the **AI Tools** section has two buttons that **navigate to full pages** (no modals):
  - **Generate Cover Letter** → `/cover-letter` (CoverLetterPage)
  - **Resume Scoring** → `/resume-scoring` (ResumeScoringPage)
- Each page has a **← Back** button to return to the dashboard.
- The same components (CoverLetterGenerator, ResumeScoring) support a `variant`: `modal` or `page`; the pages use `variant="page"`.

## Project Structure

```
CareerOps/
├── ai-service/           # Python FastAPI – AI tasks
│   ├── app/
│   │   ├── main.py       # Routes: /health, /ask, /task
│   │   ├── tasks.py      # Task handlers: cover_letter, resume_scoring, default
│   │   └── llm.py        # Ollama client (qwen2.5:7b)
│   ├── Dockerfile
│   └── requirements.txt
│
├── backend/              # Express.js + TypeScript
│   ├── src/
│   │   ├── config/       # Database, RabbitMQ
│   │   ├── middleware/   # Auth
│   │   ├── routes/       # Auth, dashboard, applications, coverLetter, resumeScoring
│   │   ├── services/
│   │   │   ├── ai/       # client.ts (runTask), resumeScoring.ts
│   │   │   ├── queue/    # RabbitMQ publisher/consumer
│   │   │   └── workers/  # coverLetterWorker.ts (calls runTask('cover_letter', …))
│   │   └── app.ts, server.ts
│   └── package.json
│
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/        # Dashboard, CoverLetterPage, ResumeScoringPage, Auth, Home, …
│   │   ├── components/  # CoverLetterGenerator, ResumeScoring, ApplicationForm, …
│   │   ├── context/     # AuthContext
│   │   ├── services/    # api
│   │   └── App.tsx
│   └── package.json
│
└── docker-compose.yml    # db, rabbitmq, ollama, ai-service, backend, frontend, worker
```

## API Endpoints

### Authentication
- `POST /api/auth/register` – Register
- `POST /api/auth/login` – Login
- `POST /api/auth/forgot-password` – Request reset (body: `{ "email": "..." }`)
- `POST /api/auth/reset-password` – Reset with token (body: `{ "token": "...", "password": "..." }`)

### Dashboard
- `GET /api/dashboard` – Dashboard data (auth required)

### Job Applications
- `GET /api/applications` – List applications (auth required)
- `POST /api/applications` – Create application (auth required)
- `PUT /api/applications/:id` – Update application (auth required)
- `DELETE /api/applications/:id` – Delete application (auth required)

### AI Tools (backend → ai-service uses task + params)
- **Cover letter (async)**  
  - `POST /api/cover-letter` – Enqueue job (body: `jobDescription`, `cvText`, optional `tone`)  
  - `GET /api/cover-letter/status/:jobId` – Job status and result  
  - `GET /api/cover-letter/jobs` – List user’s jobs (auth required)
- **Resume scoring (sync)**  
  - `POST /api/resume-scoring` – Score resume (body: `jobDescription`, `cvText`); returns `{ score, strengths, gaps, suggestions }` (auth required)

### AI service (internal)
- `GET /health` – Health check
- `POST /ask` – Legacy: prompt → answer
- `POST /task` – **Task-based:** body `{ "task": "cover_letter" | "resume_scoring", "params": { ... } }`

## Database

PostgreSQL tables include:
- `users` – User accounts
- `user_sessions` – Sessions
- `password_reset_tokens` – Reset tokens (expire after 1 hour)
- `applications` – Job applications (company, position, status, dates, notes)
- `cover_letter_jobs` – Async cover letter jobs (status, result, error_message)

## Local Development (without Docker)

### Backend
```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` with at least:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careerops
DB_USER=careerops
DB_PASSWORD=careerops
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
RABBITMQ_URL=amqp://careerops:careerops@localhost:5672
```

**Forgot password:** Set SMTP vars (`SMTP_HOST`, `SMTP_PORT`, etc.) to send real emails; without them, the reset link is shown on the success page and in backend logs.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:3000` (e.g. in `.env`) if your API is not on 3000.

### AI service + Ollama (for AI tools)
- Run Ollama locally and pull the model: `ollama pull qwen2.5:7b`
- Run the ai-service:
  ```bash
  cd ai-service
  pip install -r requirements.txt
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- Ensure `llm.py` points at your Ollama (e.g. `http://localhost:11434/api/generate` if Ollama is local).

### Worker (for cover letter jobs)
```bash
cd backend
# Same .env as backend; ensure RABBITMQ_URL and AI_SERVICE_URL are set
npm run worker
```

## Troubleshooting

- **"Failed to score resume" / 404 from AI** – Rebuild ai-service so it has the `/task` endpoint (see “If you get Failed to score resume” above).
- **Ollama / model errors** – Pull the model: `ollama pull qwen2.5:7b` (in the ollama container or locally).
- **Cover letter jobs stuck or worker errors** – Check RabbitMQ and worker logs; see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for RabbitMQ and ai-service steps.

## Next Steps

- [ ] Interview tracking
- [ ] Resume/CV upload and parsing
- [ ] Reminders and notifications
- [ ] Advanced statistics and charts
