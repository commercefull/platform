/**
 * Inventory Reserve Operations Integration Tests
 *
 * Covers the endpoint not exercised by other inventory suites:
 * - POST /business/inventory/:inventoryId/reserve
 *
 * The un-prefixed route uses :inventoryId as the location identifier.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { SEEDED_INVENTORY_LOCATION_ID } from './testUtils';

describe('Inventory Reserve Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Inventory tests');
  });

  it('POST /business/inventory/:inventoryId/reserve reserves stock', async () => {
    const resp = await client.post(
      `/business/inventory/${SEEDED_INVENTORY_LOCATION_ID}/reserve`,
      { quantity: 1 },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success ?? true).toBe(true);
  });

  it('POST /business/inventory/:inventoryId/reserve validates quantity', async () => {
    const resp = await client.post(
      `/business/inventory/${SEEDED_INVENTORY_LOCATION_ID}/reserve`,
      { quantity: 0 },
      { headers: headers() },
    );
    expectStatus(resp, 400);
  });

  it('POST /business/inventory/:inventoryId/reserve returns 404 for unknown location', async () => {
    const resp = await client.post(
      '/business/inventory/00000000-0000-0000-0000-000000000000/reserve',
      { quantity: 1 },
      { headers: headers() },
    );
    expectStatus(resp, 404);
  });
});
