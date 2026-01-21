# Testing Guide

This project includes comprehensive test suites for both frontend and backend components.

## Frontend Testing

### Setup
Frontend tests use **Vitest** and **React Testing Library**.

### Running Tests

```bash
cd frontend
npm install --legacy-peer-deps  # Required due to React 19 compatibility
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

**Note:** Due to React 19, you may need to use `--legacy-peer-deps` flag when installing. An `.npmrc` file has been added to handle this automatically.

### Test Structure
- Component tests: `src/components/__tests__/`
- Service tests: `src/services/__tests__/`
- Setup file: `src/test/setup.ts`

### Test Files
- `DashboardHeader.test.tsx` - Tests for dashboard header component
- `StatCard.test.tsx` - Tests for stat card component
- `WelcomeSection.test.tsx` - Tests for welcome section component
- `StatsSection.test.tsx` - Tests for stats section component
- `api.test.ts` - Tests for API service

## Backend Testing

### Setup
Backend tests use **Jest** and **Supertest** for API testing.

### Running Tests

```bash
cd backend
npm install
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Structure
- Route tests: `src/routes/__tests__/`
- Middleware tests: `src/middleware/__tests__/`
- Setup file: `src/test/setup.ts`

### Test Files
- `auth.test.ts` - Tests for authentication routes (register, login)
- `applications.test.ts` - Tests for job applications CRUD operations
- `coverLetter.test.ts` - Tests for cover letter generation
- `auth.test.ts` (middleware) - Tests for authentication middleware

## Test Coverage

### Frontend Coverage
- Component rendering
- User interactions
- Props handling
- Conditional rendering
- Form submissions

### Backend Coverage
- API endpoints
- Authentication middleware
- Database operations (mocked)
- Error handling
- Input validation

## Writing New Tests

### Frontend Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Backend Route Test Example

```typescript
import { describe, it, expect } from 'jest';
import request from 'supertest';
import app from '../../app';

describe('GET /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Notes

- Backend tests use mocked database connections
- Frontend tests use jsdom environment
- All tests should be isolated and independent
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
