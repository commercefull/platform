import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser, expectStatus } from '../testUtils';

describe('Gift Card Customer API Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;
  // Seeded gift card GIFT-TEST-0001 (seeds/20240805001500 + assigned in 20240805002001)
  const testGiftCardCode = 'GIFT-TEST-0001';

  beforeAll(async () => {
    client = createTestClient();
    customerToken = await loginTestUser(client);
  });

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
      expect(response.data.data).toHaveProperty('currentBalanceCents');
      expect(response.data.data).toHaveProperty('currency');
    });

    it('should return 404 for non-existent gift card code', async () => {
      const response = await client.get('/customer/gift-cards/balance/FAKE-CODE-9999');

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('should reject balance check for inactive gift card', async () => {
      // Seeded depleted card GIFT-TEST-0002 is not active
      const response = await client.get('/customer/gift-cards/balance/GIFT-TEST-0002');

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('UC-PRO-017: Redeem Gift Card', () => {
    it('should redeem a gift card with valid code and amount', async () => {
      if (!customerToken || !testGiftCardCode) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: testGiftCardCode, amountCents: 2000 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('type', 'redemption');
      expect(response.data.data).toHaveProperty('amountCents', -2000);
    });

    it('should reject redemption with insufficient balance', async () => {
      if (!customerToken || !testGiftCardCode) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: testGiftCardCode, amountCents: 9999900 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject redemption with non-existent code', async () => {
      if (!customerToken) return;

      const response = await client.post(
        '/customer/gift-cards/redeem',
        { code: 'FAKE-CODE-9999', amountCents: 1000 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('should reject redemption without authentication', async () => {
      if (!testGiftCardCode) return;

      const response = await client.post('/customer/gift-cards/redeem', {
        code: testGiftCardCode,
        amountCents: 1000,
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
        { code: testGiftCardCode, amountCents: 5000 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('type', 'reload');
    });

    it('should reject reload without authentication', async () => {
      if (!testGiftCardCode) return;

      const response = await client.post('/customer/gift-cards/reload', {
        code: testGiftCardCode,
        amountCents: 5000,
      });

      expectStatus(response, 401);
    });
  });
});
