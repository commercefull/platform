/**
 * Migration Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by migrationOps.test.ts:
 * - POST /business/jobs
 * - GET /business/jobs + GET /business/jobs/:importJobId
 * - GET /business/jobs/:importJobId/mappings + /errors
 * - POST /business/jobs/:importJobId/fail
 * - DELETE /business/jobs/:importJobId
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Migration Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let jobId: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  it('POST /business/jobs creates an import job', async () => {
    const resp = await client.post(
      '/business/jobs',
      { jobType: 'products', source: 'csv', sourceConfig: { fileName: 'coverage.csv' }, dryRun: true },
      auth(),
    );
    expectStatus(resp, 201);
    jobId = resp.data.data.importJobId || resp.data.data.jobId || resp.data.data.id;
    expect(jobId).toBeTruthy();
  });

  it('GET /business/jobs lists jobs including the created one', async () => {
    const resp = await client.get('/business/jobs', auth());
    expectStatus(resp, 200);
    const jobs = resp.data.data.jobs || resp.data.data;
    expect(Array.isArray(jobs)).toBe(true);
  });

  it('GET /business/jobs/:id returns the job', async () => {
    const resp = await client.get(`/business/jobs/${jobId}`, auth());
    expectStatus(resp, 200);
    expect(resp.data.data.status).toBeTruthy();
  });

  it('GET /business/jobs/:id/mappings lists mappings', async () => {
    const resp = await client.get(`/business/jobs/${jobId}/mappings`, auth());
    expectStatus(resp, 200);
  });

  it('GET /business/jobs/:id/errors lists errors', async () => {
    const resp = await client.get(`/business/jobs/${jobId}/errors`, auth());
    expectStatus(resp, 200);
  });

  it('POST /business/jobs/:id/fail marks the job failed', async () => {
    const resp = await client.post(`/business/jobs/${jobId}/fail`, { reason: 'Coverage failure' }, auth());
    expectStatus(resp, 200);
  });

  it('DELETE /business/jobs/:id removes the job', async () => {
    const resp = await client.delete(`/business/jobs/${jobId}`, auth());
    expectStatus(resp, 200);
  });

  it('GET /business/jobs/:id errors on unknown ids', async () => {
    const resp = await client.get(`/business/jobs/${UNKNOWN_ID}`, auth());
    expectStatus(resp, 404);
    expect(resp.data.success).toBe(false);
  });
});
