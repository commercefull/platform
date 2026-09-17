/**
 * Order Operations Integration Tests
 *
 * Covers endpoints not exercised by other order suites:
 * - POST   /business/orders/:orderId/notes
 * - DELETE /business/orders/:orderId/notes/:noteId
 * - POST   /business/orders/:orderId/packages
 * - POST   /business/orders/:orderId/packages/:packageId/tracking
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

// Seeded in seeds/20240805000495_seedTestOrder.js
const ORDER_ID = '00000000-0000-0000-0000-000000000200';
const FULFILLMENT_ID = '00000000-0000-0000-0000-000000000210';
const PACKAGE_ID = '00000000-0000-0000-0000-000000000211';

describe('Order Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const orderId = ORDER_ID;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for order tests');
  });

  describe('Order notes', () => {
    let noteId = '';

    it('POST /business/orders/:orderId/notes adds a note', async () => {
      const resp = await client.post(
        `/business/orders/${orderId}/notes`,
        { content: 'Customer called about delivery window', isCustomerVisible: false },
        { headers: headers() },
      );
      expectStatus(resp, 201);
      noteId = resp.data.data?.orderNoteId || resp.data.data?.noteId || resp.data.data?.id || '';
      expect(noteId).toBeTruthy();
    });

    it('GET /business/orders/:orderId/notes lists notes', async () => {
      const resp = await client.get(`/business/orders/${orderId}/notes`, { headers: headers() });
      expectStatus(resp, 200);
    });

    it('DELETE /business/orders/:orderId/notes/:noteId removes the note', async () => {
      if (!noteId) return;
      const resp = await client.delete(`/business/orders/${orderId}/notes/${noteId}`, { headers: headers() });
      expectStatus(resp, 200);
    });

    it('DELETE /business/orders/:orderId/notes/:noteId returns 404 for missing note', async () => {
      const resp = await client.delete(`/business/orders/${orderId}/notes/${randomUUID()}`, { headers: headers() });
      expectStatus(resp, 404);
    });
  });

  describe('Fulfillment packages', () => {
    it('POST /business/orders/:orderId/packages creates a package on the seeded fulfillment', async () => {
      const resp = await client.post(
        `/business/orders/${orderId}/packages`,
        { orderFulfillmentId: FULFILLMENT_ID, packageNumber: 'PKG-OPS-2', trackingNumber: 'TRACK-1' },
        { headers: headers() },
      );
      expectStatus(resp, 201);
    });

    it('POST /business/orders/:orderId/packages rejects a non-existent fulfillment', async () => {
      const resp = await client.post(
        `/business/orders/${orderId}/packages`,
        { orderFulfillmentId: randomUUID(), packageNumber: 'PKG-1' },
        { headers: headers() },
      );
      expectStatus(resp, 409);
    });

    it('POST /business/orders/:orderId/packages/:packageId/tracking updates tracking on the seeded package', async () => {
      const resp = await client.post(
        `/business/orders/${orderId}/packages/${PACKAGE_ID}/tracking`,
        { orderFulfillmentId: FULFILLMENT_ID, packageNumber: 'PKG-OPS-0001', trackingNumber: 'TRACK-UPDATED' },
        { headers: headers() },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/orders/:orderId/packages/:packageId/tracking returns 404 for unknown package', async () => {
      const resp = await client.post(
        `/business/orders/${orderId}/packages/${randomUUID()}/tracking`,
        { trackingNumber: 'TRACK-999' },
        { headers: headers() },
      );
      expectStatus(resp, 404);
    });
  });
});
