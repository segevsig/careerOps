// Test setup file
// Add any global test configuration here

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
});

afterAll(() => {
  // Cleanup after all tests
});
