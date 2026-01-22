# Troubleshooting Guide

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
