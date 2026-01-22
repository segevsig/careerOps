# RabbitMQ Implementation Plan for CareerOps

## Current Architecture Overview

Your CareerOps project currently has:
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL
- **Frontend**: React + TypeScript
- **Infrastructure**: Docker Compose

## Where RabbitMQ Fits In

RabbitMQ is a message broker that enables **asynchronous processing** and **decoupled communication** between services. Here's where it fits in your architecture:

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────────────────────────────┐
│         Express Backend             │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Routes     │  │   Services   │ │
│  └──────┬───────┘  └──────┬───────┘ │
│         │                  │         │
│         │ Publish Messages │         │
│         ▼                  │         │
│  ┌─────────────────────────┐        │
│  │   RabbitMQ Publisher     │        │
│  └──────────┬───────────────┘        │
└─────────────┼────────────────────────┘
              │
              │ Messages
              ▼
      ┌───────────────┐
      │   RabbitMQ    │
      │   (Broker)    │
      └───────┬───────┘
              │
              │ Consume Messages
              ▼
      ┌───────────────┐
      │  Worker       │
      │  Services     │
      │  (Consumers)  │
      └───────────────┘
```

## Why Add RabbitMQ?

### Current Problems It Solves:

1. **Synchronous Cover Letter Generation** (Current Issue)
   - Currently: User waits for OpenAI API call to complete (can take 5-30 seconds)
   - With RabbitMQ: Request is queued, user gets immediate response, processing happens in background
   - **Benefit**: Better UX, no timeouts, can handle more concurrent requests

2. **Future Scalability**
   - Email notifications (application status changes)
   - Analytics and reporting generation
   - Data export jobs
   - Scheduled tasks

3. **Decoupling**
   - Separate worker processes can be scaled independently
   - Backend API stays responsive
   - Easy to add new background jobs

## Implementation Structure

### 1. **Where to Add RabbitMQ Components**

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          (existing)
│   │   └── rabbitmq.ts          (NEW - RabbitMQ connection config)
│   │
│   ├── services/
│   │   ├── queue/
│   │   │   ├── publisher.ts     (NEW - publish messages to queues)
│   │   │   └── consumer.ts      (NEW - consume messages from queues)
│   │   │
│   │   └── workers/
│   │       └── coverLetterWorker.ts  (NEW - process cover letter generation)
│   │
│   ├── routes/
│   │   └── coverLetter.ts       (MODIFY - publish to queue instead of direct processing)
│   │
│   └── types/
│       └── queue.types.ts       (NEW - TypeScript types for queue messages)
```

### 2. **Docker Compose Changes**

Add RabbitMQ service to `docker-compose.yml`:

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"      # AMQP port
      - "15672:15672"    # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: careerops
      RABBITMQ_DEFAULT_PASS: careerops
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    # ... existing config ...
    environment:
      # ... existing env vars ...
      RABBITMQ_URL: amqp://careerops:careerops@rabbitmq:5672
    depends_on:
      rabbitmq:
        condition: service_healthy
      db:
        condition: service_healthy

  # NEW: Worker service (optional - can run in same container or separate)
  worker:
    build: ./backend
    command: npm run worker
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: careerops
      DB_USER: careerops
      DB_PASSWORD: careerops
      RABBITMQ_URL: amqp://careerops:careerops@rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      rabbitmq:
        condition: service_healthy
      db:
        condition: service_healthy

volumes:
  pgdata:
  rabbitmq_data:  # NEW
```

### 3. **Queue Design**

#### Queue Names:
- `cover-letter.generate` - For cover letter generation requests
- `cover-letter.completed` - For completed cover letters (optional, for notifications)
- `notifications.email` - For future email notifications
- `analytics.process` - For future analytics jobs

#### Message Structure:

```typescript
// Cover Letter Generation Message
{
  jobId: string,              // Unique job ID
  userId: number,             // User who requested
  jobDescription: string,
  cvText: string,
  tone?: "professional" | "friendly" | "concise",
  createdAt: string,          // ISO timestamp
  retryCount?: number         // For retry logic
}
```

## How It Works - Flow Example

### Cover Letter Generation Flow:

**Before (Current - Synchronous):**
```
User Request → Express Route → OpenAI API (wait 10s) → Response
```

**After (With RabbitMQ - Asynchronous):**
```
1. User Request → Express Route → Publish to Queue → Immediate Response (jobId)
2. Worker consumes message → Calls OpenAI API → Stores result in DB
3. Frontend polls or uses WebSocket to get result
```

### Detailed Flow:

1. **User makes request** (`POST /api/cover-letter`)
   - Route validates request
   - Creates unique job ID
   - Publishes message to `cover-letter.generate` queue
   - Returns immediately with `{ jobId, status: "processing" }`

2. **Worker process** (separate Node.js process)
   - Connects to RabbitMQ
   - Consumes messages from `cover-letter.generate`
   - Calls OpenAI API
   - Stores result in database (new table: `cover_letter_jobs`)
   - Optionally publishes completion message

3. **Frontend polling** (or WebSocket)
   - Polls `/api/cover-letter/status/:jobId`
   - Gets result when ready: `{ status: "completed", coverLetter: "..." }`

## Components to Create

### 1. **RabbitMQ Configuration** (`src/config/rabbitmq.ts`)
- Connection setup
- Channel management
- Connection retry logic

### 2. **Publisher Service** (`src/services/queue/publisher.ts`)
- Generic function to publish messages
- Queue declaration
- Error handling

### 3. **Consumer Service** (`src/services/queue/consumer.ts`)
- Generic consumer setup
- Message acknowledgment
- Error handling and retries

### 4. **Cover Letter Worker** (`src/services/workers/coverLetterWorker.ts`)
- Specific logic for cover letter generation
- OpenAI integration
- Database updates

### 5. **Database Table** (for job tracking)
```sql
CREATE TABLE cover_letter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  job_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  job_description TEXT,
  cv_text TEXT,
  tone VARCHAR(50),
  cover_letter TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

### 6. **New API Endpoints**
- `GET /api/cover-letter/status/:jobId` - Check job status
- `GET /api/cover-letter/jobs` - List user's cover letter jobs

## Benefits Summary

✅ **Better User Experience**: No waiting for long-running operations
✅ **Scalability**: Workers can be scaled independently
✅ **Reliability**: Messages persist if worker crashes
✅ **Decoupling**: API and workers are independent
✅ **Future-Proof**: Easy to add new background jobs

## Next Steps

1. **Add RabbitMQ to docker-compose.yml**
2. **Install amqplib package**: `npm install amqplib @types/amqplib`
3. **Create RabbitMQ config and services**
4. **Modify cover letter route to use queue**
5. **Create worker process**
6. **Add job tracking table**
7. **Update frontend to poll for results**

## Questions to Consider

1. **Do you want workers in a separate container or same as backend?**
   - Separate: Better isolation, can scale independently
   - Same: Simpler setup, less infrastructure

2. **How should frontend get results?**
   - Polling: Simple, works everywhere
   - WebSocket: Real-time, more complex
   - Server-Sent Events: Good middle ground

3. **What about failed jobs?**
   - Retry logic: How many retries?
   - Dead letter queue: For permanently failed jobs
   - Error notifications: Email user on failure?

Would you like me to proceed with the implementation based on this plan?
