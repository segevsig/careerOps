# RabbitMQ Usage Guide

## Quick Start

### 1. Start Services

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database
- RabbitMQ (Management UI at http://localhost:15672)
- Backend API
- Frontend
- Worker process

### 2. Access RabbitMQ Management UI

- URL: http://localhost:15672
- Username: `careerops`
- Password: `careerops`

## API Usage

### Generate Cover Letter (Async)

**Before (Synchronous):**
```bash
POST /api/cover-letter
{
  "jobDescription": "...",
  "cvText": "...",
  "tone": "professional"
}
# Response: { "coverLetter": "..." } (waits 10-30 seconds)
```

**After (Asynchronous with RabbitMQ):**
```bash
POST /api/cover-letter
{
  "jobDescription": "...",
  "cvText": "...",
  "tone": "professional"
}
# Response: { "jobId": "uuid", "status": "pending" } (immediate)
```

### Check Job Status

```bash
GET /api/cover-letter/status/:jobId
# Response: {
#   "jobId": "uuid",
#   "status": "completed",
#   "coverLetter": "...",
#   "createdAt": "...",
#   "updatedAt": "...",
#   "completedAt": "..."
# }
```

### List All Jobs

```bash
GET /api/cover-letter/jobs
# Response: {
#   "jobs": [
#     {
#       "jobId": "uuid",
#       "status": "completed",
#       "createdAt": "...",
#       "updatedAt": "...",
#       "completedAt": "..."
#     }
#   ]
# }
```

## Job Statuses

- `pending`: Job is queued, waiting to be processed
- `processing`: Worker is currently generating the cover letter
- `completed`: Cover letter generated successfully
- `failed`: Generation failed (check `errorMessage`)

## Architecture

```
User Request
    ↓
Express Route (POST /api/cover-letter)
    ↓
Create DB Record (status: pending)
    ↓
Publish to RabbitMQ Queue
    ↓
Return Job ID (immediate response)
    ↓
Worker Process (separate container)
    ↓
Consume from Queue
    ↓
Call OpenAI API
    ↓
Update DB (status: completed, coverLetter: "...")
```

## Frontend Integration Example

```typescript
// 1. Submit job
const response = await fetch('/api/cover-letter', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ jobDescription, cvText, tone })
});
const { jobId } = await response.json();

// 2. Poll for status
const pollStatus = async () => {
  const res = await fetch(`/api/cover-letter/status/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const job = await res.json();
  
  if (job.status === 'completed') {
    return job.coverLetter;
  } else if (job.status === 'failed') {
    throw new Error(job.errorMessage);
  } else {
    // Still processing, poll again
    await new Promise(resolve => setTimeout(resolve, 2000));
    return pollStatus();
  }
};

const coverLetter = await pollStatus();
```

## Monitoring

### RabbitMQ Management UI

1. Go to http://localhost:15672
2. Login with `careerops` / `careerops`
3. Check:
   - **Queues**: See message counts, consumers
   - **Connections**: See active connections
   - **Channels**: See active channels

### Queue Names

- `cover-letter.generate`: Cover letter generation jobs
- `cover-letter.completed`: Completed jobs (future use)

## Troubleshooting

### Worker not processing jobs

1. Check worker logs: `docker-compose logs worker`
2. Check RabbitMQ connection: `docker-compose logs rabbitmq`
3. Verify queue exists in Management UI

### Jobs stuck in "pending"

1. Check if worker is running: `docker-compose ps`
2. Check worker logs for errors
3. Verify OPENAI_API_KEY is set in worker environment

### Database connection issues

1. Ensure database is healthy: `docker-compose ps db`
2. Check database logs: `docker-compose logs db`
3. Verify environment variables in docker-compose.yml

## Development

### Run Worker Locally (without Docker)

```bash
cd backend
npm install
npm run worker
```

Make sure to set environment variables:
- `RABBITMQ_URL=amqp://careerops:careerops@localhost:5672`
- `DB_HOST=localhost`
- `OPENAI_API_KEY=your-key`

### Add New Queue/Worker

1. Add queue name to `src/types/queue.types.ts`:
```typescript
export enum QueueNames {
  // ... existing
  MY_NEW_QUEUE = 'my-new-queue',
}
```

2. Create publisher function in `src/services/queue/publisher.ts`

3. Create worker in `src/services/workers/myWorker.ts`

4. Add consumer in `src/worker.ts`:
```typescript
await consumeMessages(QueueNames.MY_NEW_QUEUE, processMyJob);
```

## Production Considerations

1. **Environment Variables**: Change default RabbitMQ credentials
2. **Error Handling**: Implement dead letter queues for failed jobs
3. **Retry Logic**: Add exponential backoff for retries
4. **Monitoring**: Set up alerts for queue depth, failed jobs
5. **Scaling**: Run multiple worker instances for high throughput
6. **Persistence**: RabbitMQ data is persisted in `rabbitmq_data` volume
