/**
 * B2B Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by b2b.test.ts (which exercises the lifecycle
 * transitions only):
 * - Companies: GET list/detail, POST create, PUT profile, PUT payment-terms,
 *   PUT credit-limit, GET subsidiaries
 * - Users: GET list/detail, PUT role, PUT spending-limits, PUT profile,
 *   invite + DELETE
 * - Quotes: GET list/detail, POST create, PUT notes, PUT internal-notes
 * - Approvals: GET list/detail, POST create
 *
 * Fixtures from seeds/20240805002209_seedB2bOpsData.js.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

const SEEDED = {
  COMPANY_OPS: '01945000-0000-7000-8000-000000000002',
  USER: '01945001-0000-7000-8000-000000000001',
  QUOTE_LIFECYCLE: '01945002-0000-7000-8000-000000000001',
  WORKFLOW_APPROVE: '01945003-0000-7000-8000-000000000001',
  ORGANIZATION_ID: '01911000-0000-7000-8000-000000000001',
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('B2B Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Companies', () => {
    it('GET /business/companies lists the seeded companies', async () => {
      const resp = await client.get('/business/companies', auth());
      expectStatus(resp, 200);
      const companies = resp.data.data as Array<Record<string, unknown>>;
      expect(companies.some(c => c.companyId === SEEDED.COMPANY_OPS)).toBe(true);
    });

    it('GET /business/companies/:id returns the seeded company', async () => {
      const resp = await client.get(`/business/companies/${SEEDED.COMPANY_OPS}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.name).toBe('Ops Company');
    });

    it('GET /business/companies/:id returns error for unknown company', async () => {
      const resp = await client.get(`/business/companies/${UNKNOWN_ID}`, auth());
      expect(resp.status).toBeGreaterThanOrEqual(400);
      expect(resp.data.success).toBe(false);
    });

    it('POST /business/companies creates a subsidiary company', async () => {
      const resp = await client.post(
        '/business/companies',
        { name: `Sub Co ${Date.now()}`, contactEmail: 'sub@b2b.example.com', parentId: SEEDED.COMPANY_OPS },
        auth(),
      );
      expectStatus(resp, 201);
      expect(resp.data.data.parentId).toBe(SEEDED.COMPANY_OPS);
    });

    it('PUT /business/companies/:id updates the profile', async () => {
      const resp = await client.put(
        `/business/companies/${SEEDED.COMPANY_OPS}`,
        { contactPhone: '555-800-0001', website: 'https://ops.example.com' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.contactPhone).toBe('555-800-0001');
    });

    it('PUT /business/companies/:id/payment-terms changes terms', async () => {
      const resp = await client.put(
        `/business/companies/${SEEDED.COMPANY_OPS}/payment-terms`,
        { paymentTerms: 'net60' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.paymentTerms).toBe('net60');
    });

    it('PUT /business/companies/:id/credit-limit sets the limit', async () => {
      const resp = await client.put(
        `/business/companies/${SEEDED.COMPANY_OPS}/credit-limit`,
        { creditLimitCents: 500000 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.creditLimitCents).toBe(500000);
    });

    it('GET /business/companies/:id/subsidiaries lists child companies', async () => {
      const resp = await client.get(`/business/companies/${SEEDED.COMPANY_OPS}/subsidiaries`, auth());
      expectStatus(resp, 200);
      const subs = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBeGreaterThan(0); // subsidiary created earlier this file
    });
  });

  describe('Users', () => {
    it('GET /business/users lists the seeded user', async () => {
      const resp = await client.get('/business/users', auth());
      expectStatus(resp, 200);
      const users = resp.data.data as Array<Record<string, unknown>>;
      expect(users.some(u => u.userId === SEEDED.USER)).toBe(true);
    });

    it('GET /business/users/:id returns the seeded user', async () => {
      const resp = await client.get(`/business/users/${SEEDED.USER}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.email).toBe('ops-b2b-user@example.com');
    });

    it('PUT /business/users/:id/role changes the role', async () => {
      const resp = await client.put(`/business/users/${SEEDED.USER}/role`, { role: 'approver' }, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.role).toBe('approver');
    });

    it('PUT /business/users/:id/spending-limits sets limits', async () => {
      const resp = await client.put(
        `/business/users/${SEEDED.USER}/spending-limits`,
        { spendingLimits: { perOrderLimit: 50000, monthlyLimit: 200000 } },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.spendingLimits.perOrderLimit).toBe(50000);
    });

    it('PUT /business/users/:id/profile updates profile fields', async () => {
      const resp = await client.put(
        `/business/users/${SEEDED.USER}/profile`,
        { department: 'Procurement', costCenter: 'CC-100' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.department).toBe('Procurement');
      expect(resp.data.data.costCenter).toBe('CC-100');
    });

    it('DELETE /business/users/:id removes an invited user', async () => {
      const invite = await client.post(
        '/business/users/invite',
        {
          companyId: SEEDED.COMPANY_OPS,
          email: `delete-me-${Date.now()}@example.com`,
          firstName: 'Delete',
          lastName: 'Me',
          role: 'buyer',
        },
        auth(),
      );
      expectStatus(invite, 201);
      const userId = invite.data.data.userId as string;

      const resp = await client.delete(`/business/users/${userId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.status).toBe('removed');

      // Soft-delete: the record remains queryable in 'removed' state
      const get = await client.get(`/business/users/${userId}`, auth());
      expect(get.data.data.status).toBe('removed');
    });
  });

  describe('Quotes', () => {
    it('GET /business/quotes lists the seeded quotes', async () => {
      const resp = await client.get('/business/quotes', auth());
      expectStatus(resp, 200);
      const quotes = resp.data.data as Array<Record<string, unknown>>;
      expect(quotes.some(q => q.quoteId === SEEDED.QUOTE_LIFECYCLE)).toBe(true);
    });

    it('GET /business/quotes/:id returns the seeded quote', async () => {
      const resp = await client.get(`/business/quotes/${SEEDED.QUOTE_LIFECYCLE}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.quoteNumber).toBe('Q-OPS-0001');
    });

    it('POST /business/quotes creates a draft quote', async () => {
      const resp = await client.post(
        '/business/quotes',
        { companyId: SEEDED.COMPANY_OPS, requestedBy: 'detail-test', validUntilDays: 14, notes: 'Detail coverage' },
        auth(),
      );
      expectStatus(resp, 201);
      expect(resp.data.data.status).toBe('draft');
      expect(resp.data.data.quoteId).toBeTruthy();
    });

    it('PUT /business/quotes/:id/notes sets customer notes', async () => {
      const resp = await client.put(`/business/quotes/${SEEDED.QUOTE_LIFECYCLE}/notes`, { notes: 'Customer-visible note' }, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.notes).toBe('Customer-visible note');
    });

    it('PUT /business/quotes/:id/internal-notes sets internal notes', async () => {
      const resp = await client.put(
        `/business/quotes/${SEEDED.QUOTE_LIFECYCLE}/internal-notes`,
        { internalNotes: 'Rep-only note' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.internalNotes).toBe('Rep-only note');
    });
  });

  describe('Approvals', () => {
    it('GET /business/approvals returns empty without a filter', async () => {
      const resp = await client.get('/business/approvals', auth());
      expectStatus(resp, 200);
      expect(resp.data.data).toHaveLength(0);
    });

    it('GET /business/approvals?pending=true lists the seeded workflows', async () => {
      const resp = await client.get('/business/approvals?pending=true', auth());
      expectStatus(resp, 200);
      const workflows = resp.data.data as Array<Record<string, unknown>>;
      expect(workflows.some(w => w.workflowId === SEEDED.WORKFLOW_APPROVE)).toBe(true);
    });

    it('GET /business/approvals/:id returns the seeded workflow', async () => {
      const resp = await client.get(`/business/approvals/${SEEDED.WORKFLOW_APPROVE}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.referenceNumber).toBe('REF-OPS-APPROVE');
    });

    it('POST /business/approvals creates a workflow', async () => {
      const resp = await client.post(
        '/business/approvals',
        {
          companyId: SEEDED.COMPANY_OPS,
          type: 'purchase_order',
          referenceId: randomUUID(),
          referenceNumber: `REF-NEW-${Date.now()}`,
          requestedBy: 'detail-test',
          requestedByEmail: 'requester@example.com',
          amountCents: 75000,
          approvers: [{ approverId: SEEDED.ORGANIZATION_ID, approverEmail: 'approver@example.com' }],
        },
        auth(),
      );
      expectStatus(resp, 201);
      expect(resp.data.data.status).toBe('pending');
      expect(resp.data.data.workflowId).toBeTruthy();
    });

    it('POST /business/approvals requires at least one approver', async () => {
      const resp = await client.post(
        '/business/approvals',
        {
          companyId: SEEDED.COMPANY_OPS,
          type: 'purchase_order',
          referenceId: randomUUID(),
          referenceNumber: 'REF-NO-APPROVER',
          requestedBy: 'detail-test',
          requestedByEmail: 'requester@example.com',
          amountCents: 1000,
          approvers: [],
        },
        auth(),
      );
      expect(resp.status).toBeGreaterThanOrEqual(400);
      expect(resp.data.success).toBe(false);
    });
  });
});
