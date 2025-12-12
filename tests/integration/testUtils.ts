import axios, { AxiosInstance } from 'axios';

/**
 * Create a configured API client for testing
 */
export const createTestClient = (baseURL: string = 'http://localhost:3000'): AxiosInstance => {
  return axios.create({
    baseURL,
    validateStatus: () => true, // Don't throw HTTP errors so we can test them
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Helper to start the server for integration tests
 * This should be called in a beforeAll hook
 */
export const startServer = async (): Promise<void> => {
  // This function would start the server if it's not running
  // In a real implementation, you might want to programmatically start your server
  // For now, we assume the server is already running on the standard port
};

/**
 * Helper to stop the server after integration tests
 * This should be called in an afterAll hook
 */
export const stopServer = async (): Promise<void> => {
  // This function would shut down the server used for testing
  // For now, it's a placeholder
};

/**
 * Helper to reset the database to a known state for tests
 * This should be called in beforeEach to ensure test isolation
 */
export const resetDatabase = async (): Promise<void> => {
  // This would reset the database to a known state for tests
  // In a real implementation, you'd run a script to restore a test database
  // or truncate tables and seed with test data
};

/**
 * Test authentication helper - logs in a test user and returns auth token
 */
export const loginTestUser = async (client: AxiosInstance, email: string = 'customer@example.com', password: string = 'password123'): Promise<string> => {
  const response = await client.post('/identity/login', {
    email,
    password,
  });
  
  if (response.status !== 200 || !response.data.accessToken) {
    throw new Error('Failed to login test user');
  }
  
  return response.data.accessToken;
};

/**
 * Test authentication helper - logs in an admin/merchant user and returns auth token
 */
export const loginTestAdmin = async (client: AxiosInstance): Promise<string> => {
  const response = await client.post('/business/auth/login', {
    email: 'merchant@example.com',
    password: 'password123',
  });
  
  if (response.status !== 200 || !response.data.accessToken) {
    throw new Error('Failed to login admin/merchant user');
  }
  
  return response.data.accessToken;
};
