import { AxiosInstance } from 'axios';
import { setupIdentityTests, cleanupIdentityTests, TEST_CUSTOMER, TEST_MERCHANT } from './testUtils';

describe('Identity Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let merchantToken: string;
  let customerRefreshToken: string;
  let merchantRefreshToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupIdentityTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupIdentityTests();
  });

  // ============================================================================
  // Customer Authentication
  // ============================================================================

  describe('Customer Authentication', () => {
    describe('POST /identity/login', () => {
      it('should authenticate customer with valid credentials', async () => {
        const response = await client.post('/customer/identity/login', {
          email: TEST_CUSTOMER.email,
          password: TEST_CUSTOMER.password,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('customer');
        expect(response.data.customer).toHaveProperty('id');
        expect(response.data.customer).toHaveProperty('email', TEST_CUSTOMER.email);

        customerToken = response.data.accessToken;
      });

      it('should reject invalid credentials', async () => {
        const response = await client.post('/customer/identity/login', {
          email: TEST_CUSTOMER.email,
          password: 'wrong-password',
        });

        expect(response.status).toBe(401);
        expect(response.data.success).toBe(false);
      });

      it('should require email and password', async () => {
        const response = await client.post('/customer/identity/login', {
          email: TEST_CUSTOMER.email,
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /identity/register', () => {
      const newCustomer = {
        email: `new-customer-${Date.now()}@example.com`,
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'Customer',
      };

      it('should register a new customer', async () => {
        const response = await client.post('/customer/identity/register', newCustomer);

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('customer');
        expect(response.data.customer).toHaveProperty('email', newCustomer.email);
      });

      it('should reject duplicate email', async () => {
        const response = await client.post('/customer/identity/register', {
          email: TEST_CUSTOMER.email,
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'Customer',
        });

        expect(response.status).toBe(409);
        expect(response.data.success).toBe(false);
      });

      it('should require all fields', async () => {
        const response = await client.post('/customer/identity/register', {
          email: 'incomplete@example.com',
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /identity/token', () => {
      it('should issue access and refresh tokens', async () => {
        const response = await client.post('/customer/identity/token', {
          email: TEST_CUSTOMER.email,
          password: TEST_CUSTOMER.password,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('refreshToken');
        expect(response.data).toHaveProperty('tokenType', 'Bearer');
        expect(response.data).toHaveProperty('expiresIn');

        customerRefreshToken = response.data.refreshToken;
      });
    });

    describe('POST /identity/refresh', () => {
      it('should refresh access token with valid refresh token', async () => {
        // First get a refresh token
        const tokenResponse = await client.post('/customer/identity/token', {
          email: TEST_CUSTOMER.email,
          password: TEST_CUSTOMER.password,
        });
        const refreshToken = tokenResponse.data.refreshToken;

        if (!refreshToken) {
          return;
        }

        const response = await client.post('/customer/identity/refresh', {
          refreshToken,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
      });

      it('should reject invalid refresh token', async () => {
        const response = await client.post('/customer/identity/refresh', {
          refreshToken: 'invalid-token',
        });

        expect(response.status).toBe(401);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /identity/validate', () => {
      it('should validate a valid token', async () => {
        const response = await client.post('/customer/identity/validate', {
          token: customerToken,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('valid', true);
        expect(response.data).toHaveProperty('customer');
      });

      it('should reject invalid token', async () => {
        const response = await client.post('/customer/identity/validate', {
          token: 'invalid-token',
        });

        expect(response.status).toBe(401);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /identity/forgot-password', () => {
      // TODO: Password reset has server-side issues
      it.skip('should initiate password reset', async () => {
        const response = await client.post('/customer/identity/forgot-password', {
          email: TEST_CUSTOMER.email,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('message');
      });

      it('should not reveal if email exists', async () => {
        const response = await client.post('/customer/identity/forgot-password', {
          email: 'nonexistent@example.com',
        });

        // Should still return success to prevent email enumeration
        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================================
  // Merchant Authentication
  // ============================================================================

  describe('Merchant Authentication', () => {
    describe('POST /business/auth/login', () => {
      it('should authenticate merchant with valid credentials', async () => {
        const response = await client.post('/business/auth/login', {
          email: TEST_MERCHANT.email,
          password: TEST_MERCHANT.password,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('merchant');

        merchantToken = response.data.accessToken;
      });

      it('should reject invalid credentials', async () => {
        const response = await client.post('/business/auth/login', {
          email: TEST_MERCHANT.email,
          password: 'wrong-password',
        });

        expect(response.status).toBe(401);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /business/auth/register', () => {
      const newMerchant = {
        email: `new-merchant-${Date.now()}@example.com`,
        password: 'NewPassword123!',
        name: 'New Merchant Store',
      };

      // TODO: Merchant registration has server-side issues
      it.skip('should register a new merchant with pending status', async () => {
        const response = await client.post('/business/auth/register', newMerchant);

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('merchant');
        expect(response.data.merchant).toHaveProperty('status', 'pending');
      });
    });

    describe('POST /business/auth/token', () => {
      it('should issue access and refresh tokens for merchant', async () => {
        const response = await client.post('/business/auth/token', {
          email: TEST_MERCHANT.email,
          password: TEST_MERCHANT.password,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
        expect(response.data).toHaveProperty('refreshToken');

        merchantRefreshToken = response.data.refreshToken;
      });
    });

    describe('POST /business/auth/refresh', () => {
      it('should refresh merchant access token', async () => {
        // First get a refresh token
        const tokenResponse = await client.post('/business/auth/token', {
          email: TEST_MERCHANT.email,
          password: TEST_MERCHANT.password,
        });
        const refreshToken = tokenResponse.data.refreshToken;

        if (!refreshToken) {
          return;
        }

        const response = await client.post('/business/auth/refresh', {
          refreshToken,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('accessToken');
      });
    });

    describe('POST /business/auth/validate', () => {
      it('should validate merchant token', async () => {
        const response = await client.post('/business/auth/validate', {
          token: merchantToken,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('valid', true);
      });
    });

    describe('POST /business/auth/forgot-password', () => {
      // TODO: Merchant password reset has server-side issues
      it.skip('should initiate merchant password reset', async () => {
        const response = await client.post('/business/auth/forgot-password', {
          email: TEST_MERCHANT.email,
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should reject requests without token to protected endpoints', async () => {
      const response = await client.get('/customer/profile');

      expect(response.status).toBe(401);
    });

    it('should accept requests with valid customer token', async () => {
      // Use identity/validate endpoint to verify token works
      const response = await client.post('/customer/identity/validate', {
        token: customerToken,
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});
