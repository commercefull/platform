import { AxiosInstance } from 'axios';
import { setupSupportTests, cleanupSupportTests, createTestTicket, createTestFaqCategory, createTestFaqArticle } from './testUtils';

describe('Support Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  const createdResources = {
    ticketIds: [] as string[],
    categoryIds: [] as string[],
    articleIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupSupportTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
  });

  afterAll(async () => {
    await cleanupSupportTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Ticket Management Tests (Business)
  // ============================================================================

  describe('Ticket Management (Business)', () => {
    let testTicketId: string;

    beforeAll(async () => {
      // Create a ticket as customer first
      const ticketData = createTestTicket();
      const response = await client.post('/api/support/tickets', ticketData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      if (response.data.data) {
        testTicketId = response.data.data.id;
        createdResources.ticketIds.push(testTicketId);
      }
    });

    it('UC-SUP-005: should list tickets (admin)', async () => {
      const response = await client.get('/business/support/tickets', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter tickets by status', async () => {
      const response = await client.get('/business/support/tickets', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status: 'open' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-006: should get a specific ticket (admin)', async () => {
      if (!testTicketId) return;

      const response = await client.get(`/business/support/tickets/${testTicketId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-008: should assign a ticket', async () => {
      if (!testTicketId) return;

      const response = await client.post(`/business/support/tickets/${testTicketId}/assign`, {
        agentId: 'agent-001'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
    });

    it('UC-SUP-012: should add agent message', async () => {
      if (!testTicketId) return;

      const response = await client.post(`/business/support/tickets/${testTicketId}/messages`, {
        message: 'This is an agent response.',
        isInternal: false
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-009: should resolve a ticket', async () => {
      if (!testTicketId) return;

      const response = await client.post(`/business/support/tickets/${testTicketId}/resolve`, {
        resolution: 'Issue resolved via integration test'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // FAQ Management Tests (Business)
  // ============================================================================

  describe('FAQ Management (Business)', () => {
    let testCategoryId: string;
    let testArticleId: string;

    it('UC-SUP-014: should create FAQ category', async () => {
      const categoryData = createTestFaqCategory();

      const response = await client.post('/business/support/faq/categories', categoryData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testCategoryId = response.data.data.id;
      createdResources.categoryIds.push(testCategoryId);
    });

    it('UC-SUP-013: should list FAQ categories', async () => {
      const response = await client.get('/business/support/faq/categories', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUP-018: should create FAQ article', async () => {
      const articleData = createTestFaqArticle(testCategoryId);

      const response = await client.post('/business/support/faq/articles', articleData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testArticleId = response.data.data.id;
      createdResources.articleIds.push(testArticleId);
    });

    it('UC-SUP-017: should list FAQ articles', async () => {
      const response = await client.get('/business/support/faq/articles', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUP-020: should publish FAQ article', async () => {
      const response = await client.post(`/business/support/faq/articles/${testArticleId}/publish`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer Ticket Tests
  // ============================================================================

  describe('Customer Tickets', () => {
    let customerTicketId: string;

    it('UC-SUP-031: should create a ticket (customer)', async () => {
      const ticketData = createTestTicket({ subject: 'Customer Test Ticket' });

      const response = await client.post('/api/support/tickets', ticketData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      customerTicketId = response.data.data.id;
      createdResources.ticketIds.push(customerTicketId);
    });

    it('UC-SUP-032: should get my tickets (customer)', async () => {
      const response = await client.get('/api/support/tickets/mine', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUP-033: should get my ticket details (customer)', async () => {
      const response = await client.get(`/api/support/tickets/mine/${customerTicketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-034: should add customer message', async () => {
      const response = await client.post(`/api/support/tickets/mine/${customerTicketId}/messages`, {
        message: 'Customer follow-up message'
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // FAQ Public Access Tests
  // ============================================================================

  describe('FAQ Public Access', () => {
    it('UC-SUP-027: should get public FAQ categories', async () => {
      const response = await client.get('/api/support/faq/categories');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-029: should search FAQ', async () => {
      const response = await client.get('/api/support/faq/search', {
        params: { q: 'test' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Alert Tests
  // ============================================================================

  describe('Alerts', () => {
    it('UC-SUP-036: should create stock alert (customer)', async () => {
      const response = await client.post('/api/support/alerts/stock', {
        productId: 'prod-001'
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(201);
    });

    it('UC-SUP-039: should create price alert (customer)', async () => {
      const response = await client.post('/api/support/alerts/price', {
        productId: 'prod-001',
        targetPrice: 50.00
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(201);
    });

    it('UC-SUP-023: should get stock alerts (admin)', async () => {
      const response = await client.get('/business/support/alerts/stock', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-024: should get price alerts (admin)', async () => {
      const response = await client.get('/business/support/alerts/price', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for admin ticket list', async () => {
      const response = await client.get('/business/support/tickets');
      expect(response.status).toBe(401);
    });

    it('should require auth for customer tickets', async () => {
      const response = await client.get('/api/support/tickets/mine');
      expect(response.status).toBe(401);
    });
  });
});
