// Test setup file — runs before each test suite
// Sets NODE_ENV to test to suppress logging and prevent real DB connections

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/freshguard_test';
process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32chars-long';
process.env.BIFROST_VIRTUAL_KEY = 'sk-bf-test-key';
process.env.BIFROST_BASE_URL = 'http://localhost:8080/openai';
process.env.TAVILY_API_KEY = 'tvly-test-key';
process.env.FRONTEND_URL = 'http://localhost:5173';
