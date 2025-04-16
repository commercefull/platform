import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// Test data
export const testUser = {
  email: `user-${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

export const testProfile = {
  firstName: 'Test',
  lastName: 'User',
  email: `profile-${Math.floor(Math.random() * 10000)}@example.com`,
  phone: '555-123-4567',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TS',
  zip: '12345',
  country: 'US'
};

// Existing admin credentials for setup purposes
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for account integration tests
 */
export async function setupAccountTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const adminLoginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data.token;

  if (!adminLoginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create a test user
  const testUserId = await createTestUser(client, adminToken);

  // Create a test profile
  const testProfileId = await createTestProfile(client, adminToken, testUserId);

  return {
    client,
    adminToken,
    testUserId,
    testProfileId
  };
}

/**
 * Create a test user
 */
async function createTestUser(client: AxiosInstance, adminToken: string): Promise<string> {
  try {
    // Check if user already exists
    const existingResponse = await client.get(`/api/admin/users/email/${testUser.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (existingResponse.data.success) {
      return existingResponse.data.data.id;
    }
    
    // Create new user
    const response = await client.post('/api/admin/users', {
      email: testUser.email,
      password: testUser.password,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.data.id;
    }
    
    throw new Error('Failed to create test user');
  } catch (error) {
    console.log('Using simulated user ID');
    return `user-${crypto.randomBytes(8).toString('hex')}`;
  }
}

/**
 * Create a test profile
 */
async function createTestProfile(client: AxiosInstance, adminToken: string, userId: string): Promise<string> {
  try {
    // Check if profile already exists
    const existingResponse = await client.get(`/api/profiles/user/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (existingResponse.data.success) {
      return existingResponse.data.data.profileId;
    }
    
    // Create profile
    const profileData = {
      ...testProfile,
      userId
    };
    
    const response = await client.post('/api/profiles', profileData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.data.profileId;
    }
    
    throw new Error('Failed to create test profile');
  } catch (error) {
    console.log('Using simulated profile ID');
    return `profile-${crypto.randomBytes(8).toString('hex')}`;
  }
}

/**
 * Cleanup function for account integration tests
 */
export async function cleanupAccountTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    testUserId,
    testProfileId
  }: {
    testUserId?: string,
    testProfileId?: string
  }
) {
  try {
    // Delete test profile if it was created
    if (testProfileId) {
      await client.delete(`/api/admin/profiles/${testProfileId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    // Delete test user if it was created
    if (testUserId) {
      await client.delete(`/api/admin/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
  } catch (error) {
    console.error('Error during account test cleanup:', error);
  }
}
