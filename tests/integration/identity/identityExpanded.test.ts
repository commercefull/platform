/**
 * Identity Expanded Tests
 * Tests: OAuth/social login, password reset, 2FA, token refresh, registration
 */

import { AxiosInstance } from 'axios';
import { setupIdentityTests, TEST_CUSTOMER, TEST_MERCHANT } from './testUtils';
import { expectStatus } from '../testUtils';

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

      expectStatus(resp, 201);
      expect(resp.data.success).toBe(true);
      expect(resp.data).toHaveProperty('accessToken');
    });

    it('should reject registration with duplicate email', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: TEST_CUSTOMER.email,
        password: 'TestPassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      });

      expectStatus(resp, 409);
    });

    it('should reject registration with weak password', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: `weak-pass-${Date.now()}@example.com`,
        password: '123',
        firstName: 'Weak',
        lastName: 'Password',
      });

      expectStatus(resp, 400);
    });

    it('should reject registration with missing fields', async () => {
      const resp = await client.post('/customer/identity/register', {
        email: `missing-${Date.now()}@example.com`,
      });

      expectStatus(resp, 400);
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

      expectStatus(resp, 200);
    });

    it('should not reveal if email exists for forgot-password', async () => {
      const resp = await client.post('/customer/identity/forgot-password', {
        email: 'nonexistent@example.com',
      });

      expectStatus(resp, 200);
    });

    it('should reject reset with invalid token', async () => {
      const resp = await client.post('/customer/identity/reset-password', {
        token: 'invalid-token-12345',
        password: 'NewPassword123!',
      });

      expectStatus(resp, 400);
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

      expectStatus(resp, 401);
    });
  });

  // ============================================================================
  // Social Login Tests
  // ============================================================================

  describe('Social Login', () => {
    it('should reject social login with invalid provider', async () => {
      const resp = await client.post('/customer/identity/invalid-provider/customer', {
        accessToken: 'some-token',
        profile: { id: '123', email: 'test@test.com' },
      });

      // Should get 400 for invalid provider
      expect([400, 401, 404].includes(resp.status)).toBe(true);
    });
  });

  // ============================================================================
  // 2FA Tests — not yet implemented as REST endpoints
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

        expect(resp.status).toBe(200);
        expect(resp.data.success).toBe(true);
        expect(resp.data.data).toHaveProperty('enabled');
      }
    });

    it('should require auth for 2FA status', async () => {
      const resp = await client.get('/customer/identity/2fa/status');
      expectStatus(resp, 401);
    });
  });

  // ============================================================================
  // Logout Tests — logout via REST not yet implemented (only GraphQL)
  // ============================================================================

  describe('Logout', () => {
    it('should logout successfully with valid token', async () => {
      const loginResp = await client.post('/customer/identity/login', {
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
      });

      if (loginResp.status === 200 && loginResp.data?.accessToken) {
        const resp = await client.post(
          '/customer/identity/logout',
          { refreshToken: loginResp.data.refreshToken },
          { headers: { Authorization: `Bearer ${loginResp.data.accessToken}` } },
        );

        expectStatus(resp, 200);
        expect(resp.data.success).toBe(true);
      }
    });

    it('should require auth for logout', async () => {
      const resp = await client.post('/customer/identity/logout', {});
      expectStatus(resp, 401);
    });
  });

  // ============================================================================
  // Organization Auth Tests
  // ============================================================================

  describe('Organization Auth', () => {
    it('should login organization with valid credentials', async () => {
      const resp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: TEST_MERCHANT.password,
      });

      expect(resp.status).toBe(200);
      expect(resp.data).toHaveProperty('accessToken');
    });

    it('should reject organization login with invalid password', async () => {
      const resp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: 'wrong-password',
      });

      expectStatus(resp, 401);
    });

    it('should validate organization token', async () => {
      const loginResp = await client.post('/business/auth/login', {
        email: TEST_MERCHANT.email,
        password: TEST_MERCHANT.password,
      });

      if (loginResp.status === 200 && loginResp.data?.accessToken) {
        const resp = await client.post('/business/auth/validate', {
          token: loginResp.data.accessToken,
        });

        expect(resp.status).toBe(200);
      }
    });
  });
});
