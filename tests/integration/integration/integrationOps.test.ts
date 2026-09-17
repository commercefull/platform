/**
 * Integration Operations Tests
 *
 * Covers the endpoint not exercised by integration.test.ts:
 * - PUT /business/integration/:integrationId/credentials/:credentialId
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Integration Credential Update Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  // Seeded in seeds/20240805002001_seedIntegrationTestData.js
  const integrationId = '00000000-0000-0000-0000-000000007001';
  const credentialId = '00000000-0000-0000-0000-000000007002';

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Integration tests');
  });

  it('PUT /business/integration/:integrationId/credentials/:credentialId updates credentials', async () => {
    const resp = await client.put(
      `/business/integration/${integrationId}/credentials/${credentialId}`,
      { credentials: { apiKey: 'rotated-key-98765' } },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
    // Updated credentials must not expose encrypted material
    expect(resp.data.data).not.toHaveProperty('encryptedData');
    expect(resp.data.data).not.toHaveProperty('iv');
    expect(resp.data.data).not.toHaveProperty('authTag');
  });

  it('PUT credentials for unknown credential returns 404', async () => {
    const resp = await client.put(
      `/business/integration/${integrationId}/credentials/${randomUUID()}`,
      { credentials: { apiKey: 'x' } },
      { headers: headers() },
    );
    expectStatus(resp, 404);
  });
});
