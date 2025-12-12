/**
 * B2B Companies Integration Tests
 * Tests for company CRUD operations and approval workflows
 */

import axios, { AxiosInstance } from 'axios';
import { ADMIN_CREDENTIALS } from '../../testConstants';

const API_BASE = '/business/b2b';

const createClient = (): AxiosInstance => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

describe('B2B Companies API', () => {
  let client: AxiosInstance;
  let createdCompanyId: string;

  beforeAll(async () => {
    client = createClient();
    
    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS);
    if (loginResponse.data.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.accessToken}`;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdCompanyId) {
      await client.delete(`${API_BASE}/companies/${createdCompanyId}`);
    }
  });

  describe('GET /b2b/companies', () => {
    it('should return a list of companies', async () => {
      const response = await client.get(`${API_BASE}/companies`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await client.get(`${API_BASE}/companies?status=active`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await client.get(`${API_BASE}/companies?limit=10&offset=0`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /b2b/companies', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: `Test Company ${Date.now()}`,
        legalName: 'Test Company LLC',
        taxId: `TAX-${Date.now()}`,
        industry: 'Technology',
        email: `test-${Date.now()}@example.com`,
        phone: '+1-555-0100',
        website: 'https://example.com'
      };

      const response = await client.post(`${API_BASE}/companies`, companyData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id || response.data.data.b2bCompanyId).toBeDefined();
      expect(response.data.data.name).toBe(companyData.name);
      expect(response.data.data.status).toBe('pending');

      createdCompanyId = response.data.data.id || response.data.data.b2bCompanyId;
    });

    it('should return 400 if name is missing', async () => {
      const response = await client.post(`${API_BASE}/companies`, {
        email: 'test@example.com'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /b2b/companies/:id', () => {
    it('should return a company by ID', async () => {
      if (!createdCompanyId) return;

      const response = await client.get(`${API_BASE}/companies/${createdCompanyId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id || response.data.data.b2bCompanyId).toBe(createdCompanyId);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await client.get(`${API_BASE}/companies/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /b2b/companies/:id', () => {
    it('should update a company', async () => {
      if (!createdCompanyId) return;

      const updateData = {
        industry: 'Software',
        website: 'https://updated-example.com'
      };

      const response = await client.put(`${API_BASE}/companies/${createdCompanyId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /b2b/companies/:id/approve', () => {
    it('should approve a pending company', async () => {
      if (!createdCompanyId) return;

      const response = await client.post(`${API_BASE}/companies/${createdCompanyId}/approve`, {
        creditLimit: 10000
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('active');
    });
  });

  describe('POST /b2b/companies/:id/suspend', () => {
    it('should suspend an active company', async () => {
      if (!createdCompanyId) return;

      const response = await client.post(`${API_BASE}/companies/${createdCompanyId}/suspend`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('suspended');
    });
  });

  describe('DELETE /b2b/companies/:id', () => {
    it('should delete a company', async () => {
      if (!createdCompanyId) return;

      const response = await client.delete(`${API_BASE}/companies/${createdCompanyId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdCompanyId = ''; // Clear so afterAll doesn't try to delete again
    });
  });
});
