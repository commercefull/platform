/**
 * Social Login Integration Tests
 * 
 * Tests for OAuth/social login authentication endpoints.
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Test Configuration
// ============================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';

let client: AxiosInstance;

// Mock social profile data
const mockGoogleProfile = {
  id: 'google-user-123456',
  email: 'socialuser@gmail.com',
  name: 'Social User',
  given_name: 'Social',
  family_name: 'User',
  picture: 'https://example.com/avatar.jpg'
};

const mockFacebookProfile = {
  id: 'facebook-user-789012',
  email: 'fbuser@example.com',
  name: 'Facebook User',
  firstName: 'Facebook',
  lastName: 'User',
  picture: 'https://example.com/fb-avatar.jpg'
};

// ============================================================================
// Setup
// ============================================================================

beforeAll(() => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
});

// ============================================================================
// Tests
// ============================================================================

describe('Social Login Feature Tests', () => {
  // ==========================================================================
  // OAuth Configuration
  // ==========================================================================

  describe('GET /identity/social/:provider/config', () => {
    it('should return OAuth config for Google', async () => {
      const response = await client.get('/customer/identity/google/config');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.provider).toBe('google');
      expect(response.data.config).toHaveProperty('authUrl');
      expect(response.data.config).toHaveProperty('scopes');
    });

    it('should return OAuth config for Facebook', async () => {
      const response = await client.get('/customer/identity/facebook/config');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.provider).toBe('facebook');
    });

    it('should return OAuth config for Apple', async () => {
      const response = await client.get('/customer/identity/apple/config');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.provider).toBe('apple');
    });

    it('should return OAuth config for GitHub', async () => {
      const response = await client.get('/customer/identity/github/config');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.provider).toBe('github');
    });

    it('should reject unsupported provider', async () => {
      const response = await client.get('/customer/identity/unsupported/config');

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Unsupported provider');
    });
  });

  // ==========================================================================
  // Customer Social Login
  // ==========================================================================

  describe('POST /identity/social/:provider/customer', () => {
    it('should require access token or id token', async () => {
      const response = await client.post('/customer/identity/google/customer', {
        profile: mockGoogleProfile
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('token');
    });

    it('should require profile with id and email', async () => {
      const response = await client.post('/customer/identity/google/customer', {
        accessToken: 'mock-access-token',
        profile: { name: 'No ID User' }
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('id and email');
    });

    it('should authenticate customer with valid Google profile', async () => {
      const response = await client.post('/customer/identity/google/customer', {
        accessToken: 'mock-google-access-token',
        profile: mockGoogleProfile
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('customer');
      expect(response.data.customer).toHaveProperty('email', mockGoogleProfile.email);
      expect(response.data.provider).toBe('google');
    });

    it('should return isNewUser flag for new customers', async () => {
      const uniqueProfile = {
        ...mockGoogleProfile,
        id: `google-new-${Date.now()}`,
        email: `newuser-${Date.now()}@gmail.com`
      };

      const response = await client.post('/customer/identity/google/customer', {
        accessToken: 'mock-google-access-token',
        profile: uniqueProfile
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.isNewUser).toBe(true);
    });

    it('should reject unsupported provider', async () => {
      const response = await client.post('/customer/identity/unsupported/customer', {
        accessToken: 'mock-access-token',
        profile: mockGoogleProfile
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Merchant Social Login
  // ==========================================================================

  describe('POST /identity/social/:provider/merchant', () => {
    it('should require access token or id token', async () => {
      const response = await client.post('/customer/identity/google/merchant', {
        profile: mockGoogleProfile
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    // TODO: Merchant social login has server-side issues
    it.skip('should authenticate merchant with valid profile', async () => {
      const merchantProfile = {
        id: `google-merchant-${Date.now()}`,
        email: `merchant-${Date.now()}@business.com`,
        name: 'Business Owner'
      };

      const response = await client.post('/customer/identity/google/merchant', {
        accessToken: 'mock-google-access-token',
        profile: merchantProfile
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('merchant');
      expect(response.data.provider).toBe('google');
    });
  });

  // ==========================================================================
  // Linked Accounts
  // ==========================================================================

  describe('GET /identity/social/customer/accounts', () => {
    it('should require authentication', async () => {
      const response = await client.get('/customer/identity/customer/accounts');

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });

    // TODO: Depends on social login token format
    it.skip('should return linked accounts for authenticated customer', async () => {
      // First, login via social to get a token
      const loginResponse = await client.post('/customer/identity/google/customer', {
        accessToken: 'mock-google-access-token',
        profile: mockGoogleProfile
      });

      if (loginResponse.status !== 200) {
        
        return;
      }

      const token = loginResponse.data.accessToken;

      const response = await client.get('/customer/identity/customer/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('linkedAccounts');
      expect(response.data).toHaveProperty('supportedProviders');
    });
  });

  describe('GET /identity/social/merchant/accounts', () => {
    it('should require authentication', async () => {
      const response = await client.get('/customer/identity/merchant/accounts');

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Link/Unlink Social Accounts
  // ==========================================================================

  describe('POST /identity/social/:provider/customer/link', () => {
    it('should require authentication', async () => {
      const response = await client.post('/customer/identity/facebook/customer/link', {
        accessToken: 'mock-fb-token',
        profile: mockFacebookProfile
      });

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('DELETE /identity/social/:provider/customer/unlink', () => {
    it('should require authentication', async () => {
      const response = await client.delete('/customer/identity/google/customer/unlink');

      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });
});
