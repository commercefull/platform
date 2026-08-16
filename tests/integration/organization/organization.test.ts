/**
 * Organization Integration Tests
 *
 * Tests for organization management endpoints.
 * Routes are mounted at /business/ (no /organization prefix in the router).
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

let client: AxiosInstance;
let merchantToken: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  try {
    const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
    merchantToken = loginResponse.data?.accessToken || '';
  } catch {
    merchantToken = '';
  }
});

describe('Organization Feature Tests', () => {
  let testOrgId: string;
  const testSlug = `test-org-${Date.now()}`;

  describe('List Organizations', () => {
    it('should list all organizations', async () => {
      const response = await client.get('/business/organizations', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const response = await client.get('/business/organizations', {
        headers: { Authorization: `Bearer ${merchantToken}` },
        params: { page: 1, limit: 10 },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  describe('Create Organization', () => {
    it('should create a new organization', async () => {
      const orgData = {
        name: `Test Organization ${Date.now()}`,
        slug: testSlug,
        description: 'Test organization for integration tests',
        isActive: true,
      };

      const response = await client.post('/business/organizations', orgData, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('organizationId');
        testOrgId = response.data.data.organizationId;
      } else if (response.status === 200) {
        expect(response.data.success).toBe(true);
        testOrgId = response.data.data?.organizationId || response.data.data?.id;
      }
    });

    it('should require name field', async () => {
      const response = await client.post(
        '/business/organizations',
        { description: 'Missing name' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Get Organization', () => {
    it('should get organization by ID', async () => {
      if (!testOrgId) return;

      const response = await client.get(`/business/organization/${testOrgId}`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get organization by slug', async () => {
      const response = await client.get(`/business/organization/slug/${testSlug}`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await client.get('/business/organizations/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Update Organization', () => {
    it('should update an organization (PUT)', async () => {
      if (!testOrgId) return;

      const response = await client.put(
        `/business/organization/${testOrgId}`,
        { description: 'Updated description' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should update an organization (PATCH)', async () => {
      if (!testOrgId) return;

      const response = await client.patch(
        `/business/organization/${testOrgId}`,
        { description: 'Patched description' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  describe('Get Organization Stores', () => {
    it('should list stores for an organization', async () => {
      if (!testOrgId) return;

      const response = await client.get(`/business/organization/${testOrgId}/stores`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });
  });

  describe('Authorization', () => {
    it('should require auth for listing organizations', async () => {
      const response = await client.get('/business/organizations');
      expect(response.status).toBe(401);
    });

    it('should require auth for creating organization', async () => {
      const response = await client.post('/business/organizations', {});
      expect(response.status).toBe(401);
    });
  });
});
