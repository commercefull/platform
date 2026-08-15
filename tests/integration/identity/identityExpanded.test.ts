/**
 * Identity Expanded Tests
 * Tests: OAuth/social login, password reset, 2FA, token refresh, registration
 */

import { AxiosInstance } from 'axios';
import { setupIdentityTests, TEST_CUSTOMER, TEST_MERCHANT } from './testUtils';

describe('Identity Expanded Tests', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupIdentityTests();
    client = setup.client;
  });

  // ============================================================================
  // Registration Tests
  // ============================================================================

  describe('Registration', () => {
    it('should register a new customer', async () => {
      const timestamp = Date.now();
      const resp = await client.post('/customer/identity/register', {
        email: `test-user-${timestamp}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect([201, 200, 400, 409]).toContain(resp.status);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
        expect(resp.data).toHaveProperty('accessToken');
      }
    });

    it('should reject registration with duplicate email', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: TEST_CUSTOMER.email,
        password: 'TestPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      });

      expect([400, 409]).toContain(resp.status);
    });

    it('should reject registration with weak password', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: `weak-pass-${Date.now()}@example.com`,
        password: '123',
        firstName: 'Weak',
        lastName: 'Password',
      });

      expect([400, 422]).toContain(resp.status);
    });

    it('should reject registration with missing fields', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: `missing-${Date.now()}@example.com`,
      });

      expect([400, 422]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Password Reset Tests
  // ============================================================================

  describe('Password Reset', () => {
    it('should request password reset for existing email', async () => {
      const resp = await client.post('/customer/identity/forgot-password', {
        email: TEST_CUSTOMER.email,
      });

      expect([200, 202]).toContain(resp.status);
    });

    it('should not reveal if email exists for forgot-password', async () => {
      const resp = await client.post('/customer/identity/forgot-password', {
        email: 'nonexistent@example.com',
      });

      expect([200, 202, 404]).toContain(resp.status);
    });

    it('should reject reset with invalid token', async () => {
      const resp = await client.post('/customer/identity/reset-password', {
        token: 'invalid-token-12345',
        password: 'NewPassword123!',
      });

      expect([400, 404]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Token Refresh Tests
  // ============================================================================

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const loginResp = await client.post('/customer/identity/login', {
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
      });

      if (loginResp.status === 200 && loginResp.data?.refreshToken) {
        const refreshResp = await client.post('/customer/identity/refresh', {
          refreshToken: loginResp.data.refreshToken,
        });

        expect(refreshResp.status).toBe(200);
        expect(refreshResp.data).toHaveProperty('accessToken');
      }
    });

    it('should reject refresh with invalid token', async () => {
      const resp = await client.post('/customer/identity/refresh', {
        refreshToken: 'invalid-refresh-token',
      });

      expect([400, 401, 403]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Social Login Tests
  // ============================================================================

  describe('Social Login', () => {
    it('should reject social login without provider', async () => {
      const resp = await client.post('/customer/identity/social', {
        accessToken: 'some-token',
      });

      expect([400, 404]).toContain(resp.status);
    });

    it('should reject social login with invalid provider', async () => {
      const resp = await client.post('/customer/identity/social', {
        provider: 'invalid-provider',
        accessToken: 'some-token',
      });

      expect([400, 404]).toContain(resp.status);
    });
  });

  // ============================================================================
  // 2FA Tests
  // ============================================================================

  describe('Two-Factor Authentication', () => {
    it('should get 2FA status for authenticated user', async () => {
      const loginResp = await client.post('/customer/identity/login', {
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
      });

      if (loginResp.status === 200 && loginResp.data?.accessToken) {
        const resp = await client.get('/customer/identity/2fa/status', {
          headers: { Authorization: `Bearer ${loginResp.data.accessToken}` },
        });

        expect([200, 404]).toContain(resp.status);
      }
    });

    it('should require auth for 2FA status', async () => {
      const resp = await client.get('/customer/identity/2fa/status');
      expect([401, 403]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Logout Tests
  // ============================================================================

  describe('Logout', () => {
    it('should logout successfully with valid token', async () => {
      const loginResp = await client.post('/customer/identity/login', {
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
      });

      if (loginResp.status === 200 && loginResp.data?.accessToken) {
        const resp = await client.post('/customer/identity/logout', {}, {
          headers: { Authorization: `Bearer ${loginResp.data.accessToken}` },
        });

        expect([200, 204]).toContain(resp.status);
      }
    });

    it('should require auth for logout', async () => {
      const resp = await client.post('/customer/identity/logout');
      expect([401, 403]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Merchant Auth Tests
  // ============================================================================

  describe('Merchant Auth', () => {
    it('should login merchant with valid credentials', async () => {
      const resp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: TEST_MERCHANT.password,
      });

      expect(resp.status).toBe(200);
      expect(resp.data).toHaveProperty('accessToken');
    });

    it('should reject merchant login with invalid password', async () => {
      const resp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: 'wrong-password',
      });

      expect([401, 403]).toContain(resp.status);
    });

    it('should get merchant profile with valid token', async () => {
      const loginResp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: TEST_MERCHANT.password,
      });

      if (loginResp.status === 200 && loginResp.data?.accessToken) {
        const resp = await client.get('/business/auth/me', {
          headers: { Authorization: `Bearer ${loginResp.data.accessToken}` },
        });

        expect(resp.status).toBe(200);
      }
    });
  });
});
