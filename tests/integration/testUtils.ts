import axios, { AxiosInstance } from 'axios';

/**
 * Create a configured API client for testing
 */
export const createTestClient = (baseURL: string = 'http://localhost:3000'): AxiosInstance => {
  return axios.create({
    baseURL,
    validateStatus: () => true, // Don't throw HTTP errors so we can test them
    timeout: 10000, // 10 second timeout to prevent hanging
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true' // Skip rate limiting for test requests
    }
  });
};

/**
 * Test authentication helper - logs in a test user and returns auth token
 */
export const loginTestUser = async (client: AxiosInstance, email: string = 'customer@example.com', password: string = 'password123'): Promise<string> => {
  const response = await client.post('/customer/identity/login', {
    email,
    password,
  }, {
    headers: { 'X-Test-Request': 'true' }
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
  }, {
    headers: { 'X-Test-Request': 'true' }
  });
  
  if (response.status !== 200 || !response.data.accessToken) {
    // Log the actual response for debugging
    console.error('Admin login failed:', response.status, response.data);
    throw new Error(`Failed to login admin/merchant user: ${JSON.stringify(response.data)}`);
  }
  
  return response.data.accessToken;
};
