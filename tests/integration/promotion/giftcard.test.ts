import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Gift Card Business API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdGiftCardIds: string[] = [];

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    // Cleanup: cancel any remaining test gift cards
    for (const id of createdGiftCardIds) {
      try {
        await client.post(
          `/business/gift-cards/${id}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } },
        );
      } catch {
        // ignore
      }
    }
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Gift Card CRUD (UC-PRO-008 to UC-PRO-013)
  // ============================================================================

  describe('Gift Card CRUD', () => {
    it('UC-PRO-008: should create a gift card', async () => {
      if (!adminToken) return;

      const giftCardData = {
        type: 'standard',
        initialBalance: 100,
        currency: 'USD',
        recipientEmail: 'test-recipient@example.com',
        recipientName: 'Test Recipient',
        deliveryMethod: 'email',
        isReloadable: true,
      };

      const response = await client.post('/business/gift-cards', giftCardData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('promotionGiftCardId');
      expect(response.data.data).toHaveProperty('code');
      expect(response.data.data).toHaveProperty('initialBalance', 100);
      expect(response.data.data).toHaveProperty('status', 'pending');
      createdGiftCardIds.push(response.data.data.promotionGiftCardId);
    });

    it('UC-PRO-008: should reject gift card creation without initialBalance', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/gift-cards',
        { type: 'standard' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('UC-PRO-009: should list gift cards', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/gift-cards', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('total');
    });

    it('UC-PRO-009: should filter gift cards by status', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/gift-cards?status=pending', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      if (response.data.data.length > 0) {
        for (const card of response.data.data) {
          expect(card.status).toBe('pending');
        }
      }
    });

    it('UC-PRO-010: should get a gift card by ID', async () => {
      if (!adminToken || createdGiftCardIds.length === 0) return;

      const response = await client.get(`/business/gift-cards/${createdGiftCardIds[0]}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('promotionGiftCardId', createdGiftCardIds[0]);
      expect(response.data.data).toHaveProperty('transactions');
    });

    it('UC-PRO-010: should return 404 for non-existent gift card', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/gift-cards/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
    });

    it('UC-PRO-011: should activate a gift card', async () => {
      if (!adminToken || createdGiftCardIds.length === 0) return;

      const response = await client.post(
        `/business/gift-cards/${createdGiftCardIds[0]}/activate`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PRO-012: should refund to a gift card', async () => {
      if (!adminToken || createdGiftCardIds.length === 0) return;

      const response = await client.post(
        `/business/gift-cards/${createdGiftCardIds[0]}/refund`,
        { amount: 25, notes: 'Test refund' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('type', 'refund');
      expect(response.data.data).toHaveProperty('amount', 25);
    });

    it('UC-PRO-013: should cancel a gift card', async () => {
      if (!adminToken) return;

      // Create a new gift card to cancel
      const createResponse = await client.post(
        '/business/gift-cards',
        { initialBalance: 50, currency: 'USD' },
        { headers: authHeaders() },
      );

      if (!createResponse.data.success) return;
      const cardId = createResponse.data.data.promotionGiftCardId;

      const response = await client.post(
        `/business/gift-cards/${cardId}/cancel`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for listing gift cards', async () => {
      const response = await client.get('/business/gift-cards');
      expect(response.status).toBe(401);
    });

    it('should require auth for creating gift cards', async () => {
      const response = await client.post('/business/gift-cards', { initialBalance: 50 });
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/gift-cards', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
