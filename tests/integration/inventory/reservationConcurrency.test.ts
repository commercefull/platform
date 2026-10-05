/**
 * Inventory Reservation Concurrency Integration Tests
 *
 * Fires parallel reserve requests against a single location with a small
 * quantity and asserts the conditional-update reservation path never
 * oversells: total reserved can never exceed the location's on-hand
 * quantity.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { SEEDED_PRODUCT_ID, SEEDED_STORE_WAREHOUSE_ID } from './testUtils';

describe('Inventory Reservation Concurrency Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Inventory concurrency tests');
  });

  it('never reserves more than on-hand quantity under concurrent requests', async () => {
    const createResp = await client.post(
      '/business/inventory/locations',
      {
        distributionWarehouseId: SEEDED_STORE_WAREHOUSE_ID,
        productId: SEEDED_PRODUCT_ID,
        sku: `CONC-SKU-${Date.now()}`,
        quantity: 5,
      },
      { headers: headers() },
    );
    expectStatus(createResp, 201);
    const locationId = createResp.data.inventoryLocationId || createResp.data.id || createResp.data.data?.inventoryLocationId;
    expect(locationId).toBeTruthy();

    const attempts = await Promise.all(
      Array.from({ length: 10 }, () =>
        client.post(`/business/inventory/locations/${locationId}/reserve`, { quantity: 1 }, { headers: headers() }),
      ),
    );

    const succeeded = attempts.filter(r => r.status === 200).length;
    const rejected = attempts.filter(r => r.status >= 400).length;
    expect(succeeded).toBe(5);
    expect(rejected).toBe(5);

    const location = await client.get(`/business/inventory/locations/${locationId}`, { headers: headers() });
    expectStatus(location, 200);
    const row = location.data.data ?? location.data;
    expect(row.reservedQuantity).toBe(5);
    expect(row.availableQuantity).toBe(0);
  });
});
