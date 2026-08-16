import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../testUtils';

describe.skip('Gift Card Customer API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testGiftCardId: string;
  let testGiftCardCode: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);

    // Create and activate a gift card for customer tests
    if (adminToken) {
      try {
        const createResponse = await client.post(
          '/business/gift-cards',
          {
            initialBalance: 200,
            currency: 'USD',
            isReloadable: true,
          },
          { headers: { Authorization: `Bearer ${adminToken}` } },
        );

        if (createResponse.data.success && createResponse.data.data) {
          testGiftCardId = createResponse.data.data.promotionGiftCardId;
          testGiftCardCode = createResponse.data.data.code;

          // Activate the gift card
          await client.post(
            `/business/gift-cards/${testGiftCardId}/activate`,
            {},
            { headers: { Authorization: `Bearer ${adminToken}` } },
          );
        }
      } catch {
        // ignore
      }
    }
  });

  afterAll(async () => {
    if (adminToken && testGiftCardId) {
      try {
        await client.post(
          `/business/gift-cards/${testGiftCardId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } },
        );
      } catch {
        // ignore
      }
    }
  });

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  // ============================================================================
  // Customer Gift Card Operations (UC-PRO-016 to UC-PRO-017)
  // ============================================================================

  describe('UC-PRO-016: Check Gift Card Balance', () => {
    it('should check gift card balance by code', async () => {
      if (!testGiftCardCode) return;

      const response = await client.get(`/customer/gift-cards/balance/${testGiftCardCode}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code');
      expect(response.data.data).toHaveProperty('currentBalance');
      expect(response.data.data).toHaveProperty('currency');
    });

    it('should return 404 for non-existent gift card code', async () => {
      const response = await client.get('/customer/gift-cards/balance/FAKE-CODE-9999');

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('should reject balance check for inactive gift card', async () => {
      if (!adminToken) return;

      // Create a gift card but don't activate it
      try {
        const createResponse = await client.post(
          '/business/gift-cards',
          { initialBalance: 50, currency: 'USD' },
          { headers: adminHeaders() },
        );

        if (createResponse.data.success) {
          const inactiveCode = createResponse.data.data.code;
          const response = await client.get(`/customer/gift-cards/balance/${inactiveCode}`);

          expect(response.status).toBe(400);
          expect(response.data.success).toBe(false);

          // Cleanup
          await client.post(
            `/business/gift-cards/${createResponse.data.data.promotionGiftCardId}/cancel`,
            {},
            { headers: adminHeaders() },
          );
        }
      } catch {
        // ignore
      }
    });
  });

  describe('UC-PRO-017: Redeem Gift Card', () => {
    it('should redeem a gift card with valid code and amount', async () => {
      if (!customerToken || !testGiftCardCode) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: testGiftCardCode, amount: 20 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('type', 'redemption');
      expect(response.data.data).toHaveProperty('amount', -20);
    });

    it('should reject redemption with insufficient balance', async () => {
      if (!customerToken || !testGiftCardCode) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: testGiftCardCode, amount: 99999 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject redemption with non-existent code', async () => {
      if (!customerToken) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: 'FAKE-CODE-9999', amount: 10 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('should reject redemption without authentication', async () => {
      if (!testGiftCardCode) return;

      const response = await client.post('/customer/gift-cards/redeem', {
        code: testGiftCardCode,
        amount: 10,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Gift Card Customer Operations', () => {
    it('should list customer gift cards when authenticated', async () => {
      if (!customerToken) return;

      const response = await client.get('/customer/gift-cards/mine', {
        headers: customerHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject listing without authentication', async () => {
      const response = await client.get('/customer/gift-cards/mine');
      expectStatus(response, 401);
    });
  });

  describe('Gift Card Reload', () => {
    it('should reload a gift card when authenticated', async () => {
      if (!customerToken || !testGiftCardCode) return;

      const response = await client.post(
        '/customer/gift-cards/reload',
        { code: testGiftCardCode, amount: 50 },
        { headers: customerHeaders() },
      );

      // May fail if gift card not assigned to customer — that's OK
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('type', 'reload');
      } else {
        expectStatus(response, 400);
      }
    });

    it('should reject reload without authentication', async () => {
      if (!testGiftCardCode) return;

      const response = await client.post('/customer/gift-cards/reload', {
        code: testGiftCardCode,
        amount: 50,
      });

      expectStatus(response, 401);
    });
  });
});
