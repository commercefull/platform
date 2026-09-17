/**
 * B2B Business API Integration Tests
 *
 * Tests for the B2B management endpoints (business side):
 * - POST /business/companies/:companyId/approve    — approve company
 * - POST /business/companies/:companyId/suspend    — suspend company
 * - POST /business/companies/:companyId/reactivate — reactivate company
 * - POST /business/companies/:companyId/terminate  — terminate company
 * - POST /business/users/invite                    — invite B2B user
 * - POST /business/users/:userId/activate          — activate user
 * - POST /business/users/:userId/suspend           — suspend user
 * - POST /business/users/:userId/reactivate        — reactivate user
 * - POST   /business/quotes/:quoteId/line-items              — add line item
 * - PUT    /business/quotes/:quoteId/line-items/:lineItemId  — update line item
 * - DELETE /business/quotes/:quoteId/line-items/:lineItemId  — remove line item
 * - POST   /business/quotes/:quoteId/send                    — send quote
 * - POST   /business/quotes/:quoteId/viewed                  — mark viewed
 * - POST   /business/quotes/:quoteId/accept                  — accept quote
 * - POST   /business/quotes/:quoteId/reject                  — reject quote
 * - POST   /business/quotes/:quoteId/convert                 — convert to order
 * - POST /business/approvals/:workflowId/approve   — approve workflow
 * - POST /business/approvals/:workflowId/reject    — reject workflow
 * - POST /business/approvals/:workflowId/escalate  — escalate workflow
 * - POST /business/approvals/:workflowId/cancel    — cancel workflow
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

// Seeded in seeds/20240805002209_seedB2bOpsData.js
const SEEDED = {
  COMPANY_LIFECYCLE: '01945000-0000-7000-8000-000000000001',
  COMPANY_OPS: '01945000-0000-7000-8000-000000000002',
  USER: '01945001-0000-7000-8000-000000000001',
  QUOTE_LIFECYCLE: '01945002-0000-7000-8000-000000000001',
  QUOTE_REJECT: '01945002-0000-7000-8000-000000000002',
  QUOTE_LINE_ITEM: '01945004-0000-7000-8000-000000000001',
  WORKFLOW_APPROVE: '01945003-0000-7000-8000-000000000001',
  WORKFLOW_REJECT: '01945003-0000-7000-8000-000000000002',
  WORKFLOW_NON_APPROVER: '01945003-0000-7000-8000-000000000003',
  WORKFLOW_ESCALATE: '01945003-0000-7000-8000-000000000004',
  WORKFLOW_CANCEL: '01945003-0000-7000-8000-000000000005',
};

describe('B2B Business API', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for B2B tests');
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Company Lifecycle
  // ============================================================================

  describe('Company Lifecycle', () => {
    const companyId = SEEDED.COMPANY_LIFECYCLE;

    it('should approve a pending company', async () => {
      const response = await client.post(`/business/companies/${companyId}/approve`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('approved');
    });

    it('should reject approving a non-pending company', async () => {
      const response = await client.post(`/business/companies/${companyId}/approve`, {}, { headers: authHeaders() });

      expectStatus(response, 409);
      expect(response.data.success).toBe(false);
    });

    it('should suspend a company', async () => {
      const response = await client.post(`/business/companies/${companyId}/suspend`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('suspended');
    });

    it('should reactivate a suspended company', async () => {
      const response = await client.post(`/business/companies/${companyId}/reactivate`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('approved');
    });

    it('should terminate a company', async () => {
      const response = await client.post(`/business/companies/${companyId}/terminate`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // B2B User Lifecycle
  // ============================================================================

  describe('B2B User Lifecycle', () => {
    const userId = SEEDED.USER;

    it('should invite a B2B user', async () => {
      const response = await client.post(
        '/business/users/invite',
        {
          companyId: SEEDED.COMPANY_OPS,
          email: `b2b-user-${Date.now()}@example.com`,
          firstName: 'B2B',
          lastName: 'User',
          role: 'buyer',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
    });

    it('should activate a B2B user', async () => {
      const response = await client.post(`/business/users/${userId}/activate`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should suspend a B2B user', async () => {
      const response = await client.post(`/business/users/${userId}/suspend`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reactivate a suspended B2B user', async () => {
      const response = await client.post(`/business/users/${userId}/reactivate`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for non-existent user', async () => {
      const response = await client.post(`/business/users/${randomUUID()}/activate`, {}, { headers: authHeaders() });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Quote Lifecycle
  // ============================================================================

  describe('Quote Lifecycle', () => {
    const quoteId = SEEDED.QUOTE_LIFECYCLE;

    it('should add a line item to a draft quote', async () => {
      const response = await client.post(
        `/business/quotes/${quoteId}/line-items`,
        {
          productId: randomUUID(),
          sku: 'TEST-SKU-002',
          name: 'Second Product',
          quantity: 10,
          unitPrice: 25.0,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should update a line item on a draft quote', async () => {
      const response = await client.put(
        `/business/quotes/${quoteId}/line-items/${SEEDED.QUOTE_LINE_ITEM}`,
        { quantity: 20, unitPrice: 22.5 },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should remove a line item from a draft quote', async () => {
      const response = await client.delete(`/business/quotes/${quoteId}/line-items/${SEEDED.QUOTE_LINE_ITEM}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reject line item changes on a non-draft quote', async () => {
      const response = await client.post(
        `/business/quotes/${SEEDED.QUOTE_REJECT}/line-items`,
        { productId: randomUUID(), sku: 'X', name: 'X', quantity: 1, unitPrice: 1 },
        { headers: authHeaders() },
      );

      expectStatus(response, 409);
      expect(response.data.success).toBe(false);
    });

    it('should send a draft quote', async () => {
      const response = await client.post(`/business/quotes/${quoteId}/send`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.data.status).toBe('sent');
    });

    it('should mark a sent quote as viewed', async () => {
      const response = await client.post(`/business/quotes/${quoteId}/viewed`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.data.status).toBe('viewed');
    });

    it('should accept a viewed quote', async () => {
      const response = await client.post(`/business/quotes/${quoteId}/accept`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.data.status).toBe('accepted');
    });

    it('should convert an accepted quote to an order', async () => {
      const response = await client.post(
        `/business/quotes/${quoteId}/convert`,
        { orderId: randomUUID() },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.data.status).toBe('converted');
    });

    it('should reject a sent quote', async () => {
      const response = await client.post(
        `/business/quotes/${SEEDED.QUOTE_REJECT}/reject`,
        { reason: 'Price too high' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.data.status).toBe('rejected');
    });
  });

  // ============================================================================
  // Approval Workflows
  // ============================================================================

  describe('Approval Workflows', () => {
    it('should approve a workflow as the current approver', async () => {
      const response = await client.post(
        `/business/approvals/${SEEDED.WORKFLOW_APPROVE}/approve`,
        { comments: 'Approved in test' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reject approval from a non-approver', async () => {
      const approveResponse = await client.post(
        `/business/approvals/${SEEDED.WORKFLOW_NON_APPROVER}/approve`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(approveResponse, 403);
      expect(approveResponse.data.success).toBe(false);
    });

    it('should reject a workflow as the current approver', async () => {
      const response = await client.post(
        `/business/approvals/${SEEDED.WORKFLOW_REJECT}/reject`,
        { comments: 'Rejected in test' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should escalate a workflow', async () => {
      const response = await client.post(`/business/approvals/${SEEDED.WORKFLOW_ESCALATE}/escalate`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should cancel a workflow', async () => {
      const response = await client.post(`/business/approvals/${SEEDED.WORKFLOW_CANCEL}/cancel`, {}, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for non-existent workflow', async () => {
      const response = await client.post(`/business/approvals/${randomUUID()}/cancel`, {}, { headers: authHeaders() });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Authorization
  // ============================================================================

  describe('Authorization', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.get('/business/companies');

      expectStatus(response, 401);
    });
  });
});
