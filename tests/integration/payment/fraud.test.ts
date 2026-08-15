import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Payment Fraud Prevention Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  // ============================================================================
  // Fraud Rules CRUD (UC-PAY-009 to UC-PAY-013)
  // ============================================================================

  describe('Fraud Rules CRUD', () => {
    let testRuleId: string;

    it('UC-PAY-009: should list fraud rules', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/rules', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-PAY-009: should list only active rules by default', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/rules?activeOnly=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      if (response.data.data.length > 0) {
        for (const rule of response.data.data) {
          expect(rule.isActive).toBe(true);
        }
      }
    });

    it('UC-PAY-010: should create a fraud rule', async () => {
      if (!adminToken) return;

      const ruleData = {
        name: `Test Fraud Rule ${Date.now()}`,
        description: 'Test rule for integration tests',
        ruleType: 'amount',
        entityType: 'order',
        conditions: { maxAmount: 10000 },
        action: 'flag',
        riskScore: 50,
        priority: 10,
        isActive: true,
      };

      const response = await client.post('/business/fraud/rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('fraudRuleId');
      expect(response.data.data).toHaveProperty('name', ruleData.name);
      expect(response.data.data).toHaveProperty('ruleType', 'amount');
      testRuleId = response.data.data.fraudRuleId;
    });

    it('UC-PAY-010: should reject rule creation without required fields', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/fraud/rules',
        { name: 'Missing fields rule' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('UC-PAY-011: should get a fraud rule by ID', async () => {
      if (!adminToken || !testRuleId) return;

      const response = await client.get(`/business/fraud/rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('fraudRuleId', testRuleId);
    });

    it('UC-PAY-011: should return 404 for non-existent rule', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/rules/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('UC-PAY-012: should update a fraud rule', async () => {
      if (!adminToken || !testRuleId) return;

      const response = await client.put(
        `/business/fraud/rules/${testRuleId}`,
        {
          name: 'Updated Fraud Rule',
          description: 'Updated description',
          ruleType: 'amount',
          conditions: { maxAmount: 5000 },
          action: 'block',
          riskScore: 80,
          priority: 20,
          isActive: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', 'Updated Fraud Rule');
      expect(response.data.data).toHaveProperty('action', 'block');
    });

    it('UC-PAY-013: should delete (deactivate) a fraud rule', async () => {
      if (!adminToken || !testRuleId) return;

      const response = await client.delete(`/business/fraud/rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Fraud Checks (UC-PAY-014 to UC-PAY-017)
  // ============================================================================

  describe('Fraud Checks', () => {
    it('UC-PAY-014: should list fraud checks', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/checks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PAY-014: should filter checks by status', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/checks?status=pending', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PAY-014: should filter checks by risk level', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/checks?riskLevel=high', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PAY-015: should get a fraud check by ID', async () => {
      if (!adminToken) return;

      // First list to get an existing check ID
      const listResponse = await client.get('/business/fraud/checks', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (listResponse.data.data && listResponse.data.data.length > 0) {
        const checkId = listResponse.data.data[0].fraudCheckId;
        const response = await client.get(`/business/fraud/checks/${checkId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('fraudCheckId', checkId);
      }
    });

    it('UC-PAY-015: should return 404 for non-existent check', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/checks/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('UC-PAY-016: should get pending reviews', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/reviews', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-PAY-017: should review a fraud check', async () => {
      if (!adminToken) return;

      // Get pending reviews to find a check to review
      const reviewsResponse = await client.get('/business/fraud/reviews', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (reviewsResponse.data.data && reviewsResponse.data.data.length > 0) {
        const checkId = reviewsResponse.data.data[0].fraudCheckId;
        const response = await client.post(
          `/business/fraud/checks/${checkId}/review`,
          { decision: 'approved', notes: 'Test review approval' },
          { headers: { Authorization: `Bearer ${adminToken}` } },
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      }
    });

    it('UC-PAY-017: should reject review with invalid decision', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/fraud/checks/00000000-0000-0000-0000-000000000000/review',
        { decision: 'invalid' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect([400, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Blacklist Management (UC-PAY-018 to UC-PAY-020)
  // ============================================================================

  describe('Blacklist Management', () => {
    let testBlacklistId: string;

    it('UC-PAY-018: should list blacklist entries', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/blacklist', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PAY-018: should filter blacklist by type', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/fraud/blacklist?type=ip', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PAY-019: should add an entry to blacklist', async () => {
      if (!adminToken) return;

      const entryData = {
        type: 'ip',
        value: `192.168.100.${Math.floor(Math.random() * 255)}`,
        reason: 'Test blacklist entry',
        source: 'manual',
      };

      const response = await client.post('/business/fraud/blacklist', entryData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('fraudBlacklistId');
      expect(response.data.data).toHaveProperty('type', 'ip');
      testBlacklistId = response.data.data.fraudBlacklistId;
    });

    it('UC-PAY-019: should reject blacklist entry without required fields', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/fraud/blacklist',
        { reason: 'Missing type and value' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('UC-PAY-020: should remove an entry from blacklist', async () => {
      if (!adminToken || !testBlacklistId) return;

      const response = await client.delete(`/business/fraud/blacklist/${testBlacklistId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for fraud rules', async () => {
      const response = await client.get('/business/fraud/rules');
      expect(response.status).toBe(401);
    });

    it('should require auth for fraud checks', async () => {
      const response = await client.get('/business/fraud/checks');
      expect(response.status).toBe(401);
    });

    it('should require auth for blacklist', async () => {
      const response = await client.get('/business/fraud/blacklist');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens for fraud endpoints', async () => {
      const response = await client.get('/business/fraud/rules', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
