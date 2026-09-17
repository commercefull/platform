/**
 * Migration Operations Integration Tests
 *
 * Covers endpoints not exercised elsewhere:
 * - POST /business/jobs/:importJobId/start            — start a pending job
 * - POST /business/jobs/:importJobId/complete         — complete a running job
 * - POST /business/jobs/:importJobId/fail             — fail a job
 * - POST /business/jobs/:importJobId/pause            — pause a running job
 * - POST /business/jobs/:importJobId/cancel           — cancel a job
 * - POST /business/jobs/:importJobId/mappings         — create a mapping
 * - GET  /business/jobs/:importJobId/mappings/lookup  — look up a mapping
 * - POST /business/errors/:importErrorId/resolve      — resolve an import error
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

// Seeded in seeds/20240805002206_seedMigrationTestData.js
const JOBS = {
  PENDING_START: '01940000-0000-7000-8000-000000000001',
  RUNNING_PAUSE: '01940000-0000-7000-8000-000000000002',
  PAUSED_RESUME: '01940000-0000-7000-8000-000000000003',
  PENDING_FAIL: '01940000-0000-7000-8000-000000000004',
  PENDING_CANCEL: '01940000-0000-7000-8000-000000000005',
  MAPPINGS: '01940000-0000-7000-8000-000000000006',
};
const SEEDED_ERROR_ID = '01940001-0000-7000-8000-000000000001';

describe('Migration Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Migration tests');
  });

  // ============================================================================
  // Job Lifecycle
  // ============================================================================

  describe('Job Lifecycle', () => {
    it('should start a pending job', async () => {
      const response = await client.post(`/business/jobs/${JOBS.PENDING_START}/start`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.data.status).toBe('running');
    });

    it('should pause a running job', async () => {
      const response = await client.post(`/business/jobs/${JOBS.RUNNING_PAUSE}/pause`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.data.status).toBe('paused');
    });

    it('should resume and complete a paused job', async () => {
      await client.post(`/business/jobs/${JOBS.PAUSED_RESUME}/start`, {}, { headers: headers() });

      const response = await client.post(`/business/jobs/${JOBS.PAUSED_RESUME}/complete`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.data.status).toBe('completed');
    });

    it('should fail a job', async () => {
      const response = await client.post(
        `/business/jobs/${JOBS.PENDING_FAIL}/fail`,
        { errorMessage: 'Simulated import failure' },
        { headers: headers() },
      );
      expectStatus(response, 200);
      expect(response.data.data.status).toBe('failed');
    });

    it('should cancel a job', async () => {
      const response = await client.post(`/business/jobs/${JOBS.PENDING_CANCEL}/cancel`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.data.status).toBe('cancelled');
    });
  });

  // ============================================================================
  // Mappings
  // ============================================================================

  describe('Mappings', () => {
    it('should create a mapping', async () => {
      const response = await client.post(
        `/business/jobs/${JOBS.MAPPINGS}/mappings`,
        {
          entityType: 'product',
          sourceId: 'src-001',
          platformId: '00000000-0000-0000-0000-000000000001',
          sourceData: { title: 'Legacy Product' },
        },
        { headers: headers() },
      );
      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
    });

    it('should look up a mapping by entityType and sourceId', async () => {
      const response = await client.get(`/business/jobs/${JOBS.MAPPINGS}/mappings/lookup?entityType=product&sourceId=src-001`, {
        headers: headers(),
      });
      expectStatus(response, 200);
      expect(response.data.data?.sourceId).toBe('src-001');
    });

    it('should return 404 for an unknown mapping lookup', async () => {
      const response = await client.get(`/business/jobs/${JOBS.MAPPINGS}/mappings/lookup?entityType=product&sourceId=nope`, {
        headers: headers(),
      });
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Error Resolution
  // ============================================================================

  describe('Error Resolution', () => {
    it('should resolve a seeded import error', async () => {
      const response = await client.post(`/business/errors/${SEEDED_ERROR_ID}/resolve`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 when resolving a non-existent error', async () => {
      const response = await client.post(`/business/errors/00000000-0000-0000-0000-000000000000/resolve`, {}, { headers: headers() });
      expectStatus(response, 404);
    });
  });
});
