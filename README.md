# CareerOps

A system to help you manage your entire job search process

## Features

- ✅ PostgreSQL database connection
- ✅ User authentication system
- ✅ Forgot password (email reset link)
- ✅ Personal user dashboard
- ✅ Modern and beautiful user interface

## Installation and Running

### Prerequisites

- Docker and Docker Compose installed on your machine

### Running

1. Clone the project:
```bash
git clone <repository-url>
cd CareerOps
```

2. Run all services with Docker Compose:
```bash
docker-compose up --build
```

3. Open your browser at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Local Development (without Docker)

#### Backend

```bash
cd backend
npm install
npm run dev
```

Create a `.env` file in the backend directory with the following content:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careerops
DB_USER=careerops
DB_PASSWORD=careerops
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Forgot password & email:** To send real password-reset emails, set SMTP variables:
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_SECURE`, `SMTP_FROM`.  
**Without SMTP:** the reset link is shown on the Forgot Password success page and logged in the backend console (handy for local development).

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
CareerOps/
├── backend/          # Express.js + TypeScript
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── middleware/ # Middleware (auth)
│   │   ├── routes/   # API routes
│   │   ├── app.ts    # Express setup
│   │   └── server.ts # Main server
│   └── package.json
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/   # Application pages
│   │   ├── context/ # React Context (Auth)
│   │   ├── services/ # API services
│   │   └── App.tsx
│   └── package.json
│
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset email (body: `{ "email": "..." }`)
- `POST /api/auth/reset-password` - Reset password with token from email (body: `{ "token": "...", "password": "..." }`)

### Dashboard
- `GET /api/dashboard` - Get dashboard data (requires authentication)

## Database

The system uses PostgreSQL with the following tables:
- `users` - Users
- `user_sessions` - Sessions (for future use)
- `password_reset_tokens` - Forgot-password tokens (expire after 1 hour)

## Next Steps

- [ ] Job application management
- [ ] Interview tracking
- [ ] Resume management
- [ ] Reminders and notifications
- [ ] Advanced statistics
