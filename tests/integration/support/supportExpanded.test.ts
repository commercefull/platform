/**
 * Support Expanded Integration Tests
 *
 * Covers endpoints not exercised by support.test.ts:
 *
 * Business:
 * - GET    /business/support/agents                     — list agents
 * - POST   /business/support/agents                     — create agent
 * - GET    /business/support/agents/:id                 — get agent
 * - PUT    /business/support/agents/:id                 — update agent
 * - PUT    /business/support/tickets/:id                — update ticket
 * - POST   /business/support/tickets/:id/close          — close ticket
 * - POST   /business/support/tickets/:id/escalate       — escalate ticket
 * - GET    /business/support/faq/categories/:id         — get FAQ category
 * - PUT    /business/support/faq/categories/:id         — update FAQ category
 * - GET    /business/support/faq/articles/:id           — get FAQ article
 * - PUT    /business/support/faq/articles/:id           — update FAQ article
 * - POST   /business/support/faq/articles/:id/unpublish — unpublish FAQ article
 * - POST   /business/support/alerts/stock/notify        — notify stock alerts
 * - POST   /business/support/alerts/price/notify        — notify price alerts
 *
 * Customer:
 * - GET    /customer/support/faq/categories/featured    — featured FAQ categories
 * - GET    /customer/support/faq/categories/:slug       — FAQ category by slug
 * - GET    /customer/support/faq/articles/popular       — popular FAQ articles
 * - GET    /customer/support/faq/articles/:slug         — FAQ article by slug
 * - POST   /customer/support/faq/articles/:id/feedback  — FAQ helpful vote
 * - POST   /customer/support/tickets/mine/:id/feedback  — ticket satisfaction feedback
 * - GET    /customer/support/alerts/stock/mine          — my stock alerts
 * - DELETE /customer/support/alerts/stock/mine/:id      — cancel my stock alert
 * - GET    /customer/support/alerts/price/mine          — my price alerts
 * - DELETE /customer/support/alerts/price/mine/:id      — cancel my price alert
 *
 * All fixtures come from 20240805002203_seedSupportTestData.js.
 */

import { AxiosInstance } from 'axios';
import { createTestAgent } from './testUtils';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

const TEST_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';

// Seeded fixture IDs (see seeds/20240805002203_seedSupportTestData.js)
const SEEDED = {
  AGENT_JANE: '01939000-0000-7000-8000-000000000002',
  SUPERVISOR_BOB: '01939000-0000-7000-8000-000000000003',
  TICKET_OPEN: '01939001-0000-7000-8000-000000000001',
  TICKET_IN_PROGRESS: '01939001-0000-7000-8000-000000000002',
  TICKET_OPS_ESCALATE: '01939001-0000-7000-8000-000000000004',
  TICKET_OPS_FEEDBACK: '01939001-0000-7000-8000-000000000005',
  FAQ_CATEGORY_OPS: '01939003-0000-7000-8000-000000000004',
  FAQ_CATEGORY_SLUG: 'orders-payments',
  FAQ_ARTICLE_OPS: '01939004-0000-7000-8000-000000000004',
  FAQ_ARTICLE_PUBLIC: '01939004-0000-7000-8000-000000000001',
  FAQ_ARTICLE_SLUG: 'how-to-place-order',
  STOCK_ALERT: '01939005-0000-7000-8000-000000000001',
  PRICE_ALERT: '01939006-0000-7000-8000-000000000001',
};

describe('Support Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
  });

  // ============================================================================
  // Agent Management (Business)
  // ============================================================================

  describe('Agent Management (Business)', () => {
    it('should create an agent', async () => {
      const response = await client.post('/business/support/agents', createTestAgent(), {
        headers: adminHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.supportAgentId || response.data.data?.id).toBeTruthy();
    });

    it('should list agents', async () => {
      const response = await client.get('/business/support/agents', { headers: adminHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should filter agents by department', async () => {
      const response = await client.get('/business/support/agents', {
        headers: adminHeaders(),
        params: { department: 'Customer Service' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get an agent by ID', async () => {
      const response = await client.get(`/business/support/agents/${SEEDED.AGENT_JANE}`, { headers: adminHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await client.get('/business/support/agents/00000000-0000-0000-0000-000000000000', {
        headers: adminHeaders(),
      });

      expect(response.status).toBe(404);
    });

    it('should update an agent', async () => {
      // saveAgent rewrites all columns, so a complete agent body is required
      const response = await client.put(
        `/business/support/agents/${SEEDED.AGENT_JANE}`,
        createTestAgent({ department: 'Technical Support', maxTickets: 30, isAvailable: false }),
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should require auth for agent list', async () => {
      const response = await client.get('/business/support/agents');

      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Ticket Updates (Business)
  // ============================================================================

  describe('Ticket Updates (Business)', () => {
    it('should update a ticket', async () => {
      const response = await client.put(
        `/business/support/tickets/${SEEDED.TICKET_IN_PROGRESS}`,
        { priority: 'high', category: 'technical' },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should close a ticket', async () => {
      const response = await client.post(`/business/support/tickets/${SEEDED.TICKET_OPEN}/close`, {}, { headers: adminHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should escalate a ticket', async () => {
      // escalatedTo references supportAgent, so a seeded agent UUID is required
      const response = await client.post(
        `/business/support/tickets/${SEEDED.TICKET_OPS_ESCALATE}/escalate`,
        { escalatedTo: SEEDED.SUPERVISOR_BOB, reason: 'Customer requested escalation' },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // FAQ Management by ID (Business)
  // ============================================================================

  describe('FAQ Management by ID (Business)', () => {
    it('should get a FAQ category by ID', async () => {
      const response = await client.get(`/business/support/faq/categories/${SEEDED.FAQ_CATEGORY_OPS}`, { headers: adminHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent FAQ category', async () => {
      const response = await client.get('/business/support/faq/categories/00000000-0000-0000-0000-000000000000', {
        headers: adminHeaders(),
      });

      expect(response.status).toBe(404);
    });

    it('should update a FAQ category', async () => {
      // saveCategory recomputes the slug from name/slug, so both are required
      const response = await client.put(
        `/business/support/faq/categories/${SEEDED.FAQ_CATEGORY_OPS}`,
        {
          name: 'Updated Category',
          slug: 'updated-category',
          description: 'Updated FAQ category description',
          sortOrder: 5,
        },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get a FAQ article by ID', async () => {
      const response = await client.get(`/business/support/faq/articles/${SEEDED.FAQ_ARTICLE_OPS}`, { headers: adminHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should update a FAQ article', async () => {
      const response = await client.put(
        `/business/support/faq/articles/${SEEDED.FAQ_ARTICLE_OPS}`,
        { title: 'Updated FAQ Article', content: 'Updated content for the FAQ article.' },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should unpublish a FAQ article', async () => {
      const response = await client.post(
        `/business/support/faq/articles/${SEEDED.FAQ_ARTICLE_OPS}/unpublish`,
        {},
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Alert Notifications (Business)
  // ============================================================================

  describe('Alert Notifications (Business)', () => {
    it('should notify stock alerts for a product', async () => {
      const response = await client.post(
        '/business/support/alerts/stock/notify',
        { productId: TEST_PRODUCT_ID },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('Notified');
    });

    it('should notify price alerts for a product', async () => {
      const response = await client.post(
        '/business/support/alerts/price/notify',
        { productId: TEST_PRODUCT_ID, newPrice: 40.0 },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.message).toContain('Notified');
    });
  });

  // ============================================================================
  // FAQ Public Access (Customer)
  // ============================================================================

  describe('FAQ Public Access (Customer)', () => {
    it('should list featured FAQ categories', async () => {
      const response = await client.get('/customer/support/faq/categories/featured');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get a FAQ category by slug', async () => {
      const response = await client.get(`/customer/support/faq/categories/${SEEDED.FAQ_CATEGORY_SLUG}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('articles');
    });

    it('should return 404 for inactive or non-existent category slug', async () => {
      const response = await client.get('/customer/support/faq/categories/no-such-category-slug');

      expect(response.status).toBe(404);
    });

    it('should list popular FAQ articles', async () => {
      const response = await client.get('/customer/support/faq/articles/popular');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get a FAQ article by slug', async () => {
      const response = await client.get(`/customer/support/faq/articles/${SEEDED.FAQ_ARTICLE_SLUG}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('relatedArticles');
    });

    it('should return 404 for unpublished or non-existent article slug', async () => {
      const response = await client.get('/customer/support/faq/articles/no-such-article-slug');

      expect(response.status).toBe(404);
    });

    it('should submit FAQ article feedback', async () => {
      const response = await client.post(`/customer/support/faq/articles/${SEEDED.FAQ_ARTICLE_PUBLIC}/feedback`, {
        isHelpful: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Ticket Feedback (Customer)
  // ============================================================================

  describe('Ticket Feedback (Customer)', () => {
    it('should submit satisfaction feedback for a resolved ticket', async () => {
      const response = await client.post(
        `/customer/support/tickets/mine/${SEEDED.TICKET_OPS_FEEDBACK}/feedback`,
        { satisfaction: 5, feedback: 'Great support experience' },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject feedback with out-of-range satisfaction', async () => {
      const response = await client.post(
        `/customer/support/tickets/mine/${SEEDED.TICKET_OPS_FEEDBACK}/feedback`,
        { satisfaction: 10 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Customer Alert Management
  // ============================================================================

  describe('Customer Alert Management', () => {
    it('should list my stock alerts', async () => {
      const response = await client.get('/customer/support/alerts/stock/mine', { headers: customerHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should cancel my stock alert', async () => {
      const response = await client.delete(`/customer/support/alerts/stock/mine/${SEEDED.STOCK_ALERT}`, {
        headers: customerHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 when cancelling a non-existent stock alert', async () => {
      const response = await client.delete('/customer/support/alerts/stock/mine/00000000-0000-0000-0000-000000000000', {
        headers: customerHeaders(),
      });

      expect(response.status).toBe(404);
    });

    it('should list my price alerts', async () => {
      const response = await client.get('/customer/support/alerts/price/mine', { headers: customerHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should cancel my price alert', async () => {
      const response = await client.delete(`/customer/support/alerts/price/mine/${SEEDED.PRICE_ALERT}`, {
        headers: customerHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});
