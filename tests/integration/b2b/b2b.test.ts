import axios, { AxiosInstance } from 'axios';
import {
  TEST_B2B_COMPANY_ID,
  TEST_B2B_QUOTE_ID,
  ADMIN_CREDENTIALS
} from '../testConstants';

// Create axios client for tests
const createClient = () => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Helper to create test company data
const createTestCompany = (overrides: Partial<any> = {}) => ({
  name: `Test Company ${Date.now()}`,
  taxId: `TAX-${Date.now()}`,
  industry: 'Technology',
  creditLimit: 50000,
  paymentTerms: 'net30',
  primaryContact: {
    name: 'John Doe',
    email: `contact-${Date.now()}@example.com`,
    phone: '+1234567890'
  },
  billingAddress: {
    addressLine1: '123 Business St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  },
  ...overrides
});

// Helper to create test quote data
const createTestQuote = (companyId: string, overrides: Partial<any> = {}) => ({
  b2bCompanyId: companyId,
  items: [
    { productId: 'prod-001', quantity: 10, customPrice: 99.99 }
  ],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Integration test quote',
  ...overrides
});

describe('B2B Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    companyIds: [] as string[],
    quoteIds: [] as string[],
    workflowIds: [] as string[]
  };

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    
    // Get admin token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS);
    adminToken = loginResponse.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup dynamically created resources (not seeded ones)
    const headers = { Authorization: `Bearer ${adminToken}` };
    const seededIds = [TEST_B2B_COMPANY_ID, TEST_B2B_QUOTE_ID];
    
    for (const id of createdResources.companyIds) {
      if (!seededIds.includes(id)) {
        try { await client.delete(`/business/b2b/companies/${id}`, { headers }); } catch (e) {}
      }
    }
    for (const id of createdResources.quoteIds) {
      if (!seededIds.includes(id)) {
        try { await client.delete(`/business/b2b/quotes/${id}`, { headers }); } catch (e) {}
      }
    }
    for (const id of createdResources.workflowIds) {
      try { await client.delete(`/business/b2b/workflows/${id}`, { headers }); } catch (e) {}
    }
  });

  // ============================================================================
  // Company Management Tests (UC-B2B-001 to UC-B2B-007)
  // ============================================================================

  describe('Company Management', () => {
    let testCompanyId: string;

    it('UC-B2B-003: should create a company', async () => {
      const companyData = createTestCompany();

      const response = await client.post('/business/companies', companyData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bCompanyId');
      expect(response.data.data).toHaveProperty('name', companyData.name);

      testCompanyId = response.data.data.b2bCompanyId;
      createdResources.companyIds.push(testCompanyId);
    });

    it('UC-B2B-001: should list companies', async () => {
      const response = await client.get('/business/companies', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-B2B-002: should get a specific company', async () => {
      const response = await client.get(`/business/companies/${testCompanyId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bCompanyId', testCompanyId);
    });

    it('UC-B2B-004: should update a company', async () => {
      const updateData = { creditLimit: 75000 };

      const response = await client.put(`/business/companies/${testCompanyId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-005: should approve a company', async () => {
      const response = await client.post(`/business/companies/${testCompanyId}/approve`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-006: should suspend a company', async () => {
      const response = await client.post(`/business/companies/${testCompanyId}/suspend`, {
        reason: 'Integration test suspension'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Company Users Tests (UC-B2B-008 to UC-B2B-011)
  // ============================================================================

  describe('Company Users', () => {
    let testCompanyId: string;
    let testUserId: string;

    beforeAll(async () => {
      const companyData = createTestCompany();
      const response = await client.post('/business/companies', companyData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testCompanyId = response.data.data.b2bCompanyId;
      createdResources.companyIds.push(testCompanyId);
    });

    it('UC-B2B-009: should create a company user', async () => {
      const userData = {
        email: `user-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'buyer',
        spendingLimit: 5000
      };

      const response = await client.post(`/business/companies/${testCompanyId}/users`, userData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bCompanyUserId');

      testUserId = response.data.data.b2bCompanyUserId;
    });

    it('UC-B2B-008: should list company users', async () => {
      const response = await client.get(`/business/companies/${testCompanyId}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-B2B-010: should update a company user', async () => {
      const updateData = { spendingLimit: 10000 };

      const response = await client.put(`/business/companies/${testCompanyId}/users/${testUserId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-011: should delete a company user', async () => {
      const response = await client.delete(`/business/companies/${testCompanyId}/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Quote Management Tests (UC-B2B-016 to UC-B2B-024)
  // ============================================================================

  describe('Quote Management', () => {
    let testCompanyId: string;
    let testQuoteId: string;

    beforeAll(async () => {
      const companyData = createTestCompany();
      const response = await client.post('/business/companies', companyData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testCompanyId = response.data.data.b2bCompanyId;
      createdResources.companyIds.push(testCompanyId);
    });

    it('UC-B2B-018: should create a quote', async () => {
      const quoteData = createTestQuote(testCompanyId);

      const response = await client.post('/business/quotes', quoteData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bQuoteId');

      testQuoteId = response.data.data.b2bQuoteId;
      createdResources.quoteIds.push(testQuoteId);
    });

    it('UC-B2B-016: should list quotes', async () => {
      const response = await client.get('/business/quotes', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-B2B-017: should get a specific quote', async () => {
      const response = await client.get(`/business/quotes/${testQuoteId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bQuoteId', testQuoteId);
    });

    it('UC-B2B-019: should update a quote', async () => {
      const updateData = { notes: 'Updated notes' };

      const response = await client.put(`/business/quotes/${testQuoteId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-022: should add a quote item', async () => {
      const itemData = { name: 'Test Product', quantity: 5, unitPrice: 149.99, isCustomItem: true };

      const response = await client.post(`/business/quotes/${testQuoteId}/items`, itemData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-020: should send a quote', async () => {
      const response = await client.post(`/business/quotes/${testQuoteId}/send`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Approval Workflow Tests (UC-B2B-025 to UC-B2B-031)
  // ============================================================================

  describe('Approval Workflows', () => {
    let testWorkflowId: string;

    it('UC-B2B-026: should create a workflow', async () => {
      const workflowData = {
        name: `Test Workflow ${Date.now()}`,
        workflowType: 'order',
        conditions: { minAmount: 1000 },
        approvers: [{ userId: 'user-001', level: 1 }],
        isActive: true
      };

      const response = await client.post('/business/workflows', workflowData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('b2bApprovalWorkflowId');

      testWorkflowId = response.data.data.b2bApprovalWorkflowId;
      createdResources.workflowIds.push(testWorkflowId);
    });

    it('UC-B2B-025: should list workflows', async () => {
      const response = await client.get('/business/workflows', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific workflow', async () => {
      const response = await client.get(`/business/workflows/${testWorkflowId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-B2B-029: should list approval requests', async () => {
      const response = await client.get('/business/approvals', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require authentication for company list', async () => {
      const response = await client.get('/business/companies');
      // 401 or 403 are both acceptable for unauthenticated requests
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/companies', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      // 401 or 403 are both acceptable for invalid tokens
      expect(response.status).toBe(401);
    });
  });
});
