# Troubleshooting Guide

## RabbitMQ and AI pipeline errors

**Important:** RabbitMQ is used only by the **Node.js backend and worker**. The **Python ai-service does not use RabbitMQ** – it is called by the worker over HTTP (`AI_SERVICE_URL`, e.g. http://localhost:8000/ask). If you see a RabbitMQ-related error, it usually comes from the backend or worker; if the worker fails when calling the ai-service, the error may still show up in worker logs.

### 1. Check which service is failing

Run these and look for errors:

```bash
# RabbitMQ itself (broker)
docker compose logs rabbitmq

# Node worker (consumes from RabbitMQ, then calls ai-service)
docker compose logs worker

# Python ai-service (called by worker via HTTP; no RabbitMQ)
docker compose logs ai-service

# Backend (publishes jobs to RabbitMQ)
docker compose logs backend
```

### 2. Check RabbitMQ is up and reachable

```bash
# Container status
docker compose ps rabbitmq

# Management UI (login: careerops / careerops)
open http://localhost:15672

# From backend/worker (health endpoint)
curl http://localhost:3000/health/rabbitmq
```

If RabbitMQ is down: `docker compose up -d rabbitmq`.

### 3. Check the worker (Node – RabbitMQ consumer)

The worker connects to RabbitMQ and processes cover letter jobs. When it runs a job, it calls the **ai-service** over HTTP. Errors here can look like “RabbitMQ” or “queue” but the root cause might be the ai-service:

```bash
# Follow worker logs
docker compose logs -f worker

# Look for:
# - "Failed to connect to RabbitMQ" / "Consumer setup failed" → RabbitMQ or URL
# - "AI service error" / "Cover letter job failed" → often ai-service or network
```

Fix RabbitMQ/URL: ensure `RABBITMQ_URL` is correct (e.g. `amqp://careerops:careerops@rabbitmq:5672` in Docker). Fix ai-service errors: see step 4.

### 4. Check the ai-service (Python – no RabbitMQ)

The ai-service is **only** called by the worker via HTTP. It does not connect to RabbitMQ. If the worker fails when calling it, check:

```bash
# Is the ai-service running?
docker compose ps ai-service

# Recent logs (Ollama, timeouts, 500s)
docker compose logs ai-service

# Can the worker reach it? (from host; in Docker, worker uses http://ai-service:8000)
curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"prompt":"Hi"}'
```

Ensure `AI_SERVICE_URL` for the worker points to the ai-service (e.g. `http://ai-service:8000` in Docker, `http://localhost:8000` locally). If ai-service fails, fix Ollama/model or Python errors shown in `docker compose logs ai-service`.

### 5. Quick checklist

| Step | Command | What to check |
|------|---------|----------------|
| RabbitMQ up | `docker compose ps rabbitmq` | State: Up (healthy) |
| Worker logs | `docker compose logs worker` | Connection errors vs "Cover letter job failed" / "AI service error" |
| ai-service logs | `docker compose logs ai-service` | Python/Ollama errors, timeouts |
| Backend logs | `docker compose logs backend` | "Failed to publish job to queue" |
| Health | `curl http://localhost:3000/health/rabbitmq` | `{"status":"ok","rabbitmq":"connected"}` |

### 6. Restart the pipeline

```bash
docker compose restart rabbitmq worker backend
# If you use ai-service for cover letter / resume scoring:
docker compose restart ai-service worker
```

---

## Connection Reset Error (ERR_CONNECTION_RESET)

If you're getting `net::ERR_CONNECTION_RESET` when accessing `/api/cover-letter`, check the following:

### 1. Check if Server is Running

```bash
# Check if backend is running
docker-compose ps backend

# Or if running locally
ps aux | grep "node.*server"
```

**Solution**: Start the server
```bash
# With Docker
docker-compose up backend

# Or locally
cd backend && npm run dev
```

### 2. Check Server Logs

```bash
# Docker logs
docker-compose logs backend

# Look for errors like:
# - "Failed to connect to RabbitMQ"
# - "Error: Cannot find module"
# - Database connection errors
```

### 3. Verify Dependencies are Installed

```bash
cd backend
npm install
```

Make sure these packages are installed:
- `amqplib`
- `uuid`
- `@types/amqplib`
- `@types/uuid`

### 4. Check RabbitMQ Status

The server should work even if RabbitMQ is down (jobs will be saved in DB), but let's verify:

```bash
# Check RabbitMQ container
docker-compose ps rabbitmq

# Check RabbitMQ logs
docker-compose logs rabbitmq

# Test connection
curl http://localhost:15672
```

**Solution**: Start RabbitMQ
```bash
docker-compose up rabbitmq
```

### 5. Check Database Table Exists

The `cover_letter_jobs` table should be created automatically on server start. Verify:

```bash
# Connect to database
docker-compose exec db psql -U careerops -d careerops

# Check if table exists
\dt cover_letter_jobs

# If missing, the server should create it on startup
```

### 6. Test Health Endpoints

```bash
# Basic health check
curl http://localhost:3000/health

# RabbitMQ health check
curl http://localhost:3000/health/rabbitmq
```

### 7. Common Issues and Solutions

#### Issue: "Cannot find module 'amqplib'"
**Solution**: 
```bash
cd backend && npm install
```

#### Issue: "Failed to connect to RabbitMQ"
**Solution**: 
- Start RabbitMQ: `docker-compose up rabbitmq`
- Or set `RABBITMQ_URL` environment variable
- The API will still work, but jobs won't be processed until RabbitMQ is available

#### Issue: "relation 'cover_letter_jobs' does not exist"
**Solution**: 
- Restart the backend server - it will create the table automatically
- Or run the database init manually

#### Issue: Server crashes on startup
**Solution**: 
- Check logs: `docker-compose logs backend`
- Verify all environment variables are set
- Make sure database is running: `docker-compose ps db`

### 8. Quick Fix Checklist

1. ✅ Install dependencies: `cd backend && npm install`
2. ✅ Start all services: `docker-compose up --build`
3. ✅ Check server is running: `curl http://localhost:3000/health`
4. ✅ Check RabbitMQ: `curl http://localhost:15672` (should show login page)
5. ✅ Check database: `docker-compose ps db` (should be healthy)

### 9. Testing the Endpoint

Once everything is running:

```bash
# Get auth token first (from login)
TOKEN="your-jwt-token"

# Test cover letter endpoint
curl -X POST http://localhost:3000/api/cover-letter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We are looking for a developer...",
    "cvText": "John Doe, experienced developer...",
    "tone": "professional"
  }'
```

Expected response:
```json
{
  "jobId": "uuid-here",
  "status": "pending",
  "message": "Cover letter generation started"
}
```

### 10. Still Not Working?

1. **Check all logs**:
   ```bash
   docker-compose logs
   ```

2. **Restart everything**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Verify environment variables**:
   - Check `.env` file exists in backend directory
   - Or check `docker-compose.yml` environment section

4. **Check port conflicts**:
   ```bash
   lsof -i :3000  # Check if port 3000 is in use
   ```
