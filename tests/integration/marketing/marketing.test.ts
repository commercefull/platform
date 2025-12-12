import { AxiosInstance } from 'axios';
import { setupMarketingTests, cleanupMarketingTests, createTestCampaign, createTestTemplate } from './testUtils';

describe('Marketing Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    campaignIds: [] as string[],
    templateIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupMarketingTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupMarketingTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Email Campaign Tests (UC-MKT-001 to UC-MKT-007)
  // ============================================================================

  describe('Email Campaigns', () => {
    let testCampaignId: string;

    it('UC-MKT-003: should create a campaign', async () => {
      const campaignData = createTestCampaign();

      const response = await client.post('/business/campaigns', campaignData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testCampaignId = response.data.data.id;
      createdResources.campaignIds.push(testCampaignId);
    });

    it('UC-MKT-001: should list campaigns', async () => {
      const response = await client.get('/business/campaigns', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-MKT-002: should get a specific campaign', async () => {
      const response = await client.get(`/business/campaigns/${testCampaignId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-MKT-004: should update a campaign', async () => {
      const updateData = { subject: 'Updated Subject' };

      const response = await client.put(`/business/campaigns/${testCampaignId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Email Template Tests (UC-MKT-008 to UC-MKT-012)
  // ============================================================================

  describe('Email Templates', () => {
    let testTemplateId: string;

    it('UC-MKT-010: should create a template', async () => {
      const templateData = createTestTemplate();

      const response = await client.post('/business/templates', templateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testTemplateId = response.data.data.id;
      createdResources.templateIds.push(testTemplateId);
    });

    it('UC-MKT-008: should list templates', async () => {
      const response = await client.get('/business/templates', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-MKT-009: should get a specific template', async () => {
      const response = await client.get(`/business/templates/${testTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-MKT-011: should update a template', async () => {
      const updateData = { subject: 'Updated Template Subject' };

      const response = await client.put(`/business/templates/${testTemplateId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Abandoned Cart Tests (UC-MKT-013 to UC-MKT-015)
  // ============================================================================

  describe('Abandoned Carts', () => {
    it('UC-MKT-013: should list abandoned carts', async () => {
      const response = await client.get('/business/abandoned-carts', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-MKT-015: should get abandoned cart stats', async () => {
      const response = await client.get('/business/abandoned-carts/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Product Recommendations Tests (UC-MKT-016 to UC-MKT-020)
  // ============================================================================

  describe('Product Recommendations', () => {
    it('UC-MKT-016: should list recommendations', async () => {
      const response = await client.get('/business/recommendations', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-MKT-017: should create a recommendation', async () => {
      const recData = {
        sourceProductId: 'prod-001',
        targetProductId: 'prod-002',
        type: 'cross_sell',
        priority: 1
      };

      const response = await client.post('/business/recommendations', recData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // May return 201 or error if products don't exist
      expect([201, 400, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Affiliate Tests (UC-MKT-021 to UC-MKT-029)
  // ============================================================================

  describe('Affiliates', () => {
    it('UC-MKT-021: should list affiliates', async () => {
      const response = await client.get('/business/affiliates', {
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
    it('should require auth for campaigns', async () => {
      const response = await client.get('/business/campaigns');
      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/campaigns', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect([401, 403]).toContain(response.status);
    });
  });
});
