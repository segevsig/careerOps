// Test setup file
// Add any global test configuration here

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.AI_SERVICE_URL = 'http://localhost:8000';
});

afterAll(() => {
  // Cleanup after all tests
});
