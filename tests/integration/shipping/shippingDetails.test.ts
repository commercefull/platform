/**
 * Shipping Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by shipping.test.ts / shippingExpanded.test.ts /
 * shippingOps.test.ts:
 * - POST/PUT/DELETE /business/rates (rate mutations)
 * - GET/POST/PUT/DELETE /business/surcharges + GET /rates/:id/surcharges
 * - POST /business/labels + GET /business/labels/:id
 * - GET /business/track/:id + GET /business/track?trackingNumber=
 * - Public surface: GET /customer/methods, /customer/packaging-types,
 *   POST /customer/calculate-rates
 *
 * Fixtures from seeds/20240805001600_seedShippingTestData.js.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import {
  SEEDED_CARRIER_IDS,
  SEEDED_METHOD_IDS,
  SEEDED_ZONE_IDS,
  SEEDED_RATE_IDS,
  createTestRate,
} from './testUtils';

const SEEDED_LABEL_ID = '01936005-0000-7000-8000-000000000001';
const SEEDED_TRACKING = 'TRK-OPS-SEED-001';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Shipping Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Rate mutations', () => {
    let rateId = '';

    it('POST /business/rates creates a rate', async () => {
      const resp = await client.post(
        '/business/rates',
        createTestRate(SEEDED_ZONE_IDS.US_WEST, SEEDED_METHOD_IDS.USPS_PRIORITY, { name: 'Coverage Rate' }),
        auth(),
      );
      expectStatus(resp, 201);
      rateId = (resp.data.data.shippingRateId || resp.data.data.id) as string;
      expect(rateId).toBeTruthy();
    });

    it('PUT /business/rates/:id updates the rate', async () => {
      const resp = await client.put(`/business/rates/${rateId}`, { baseRateCents: 1499 }, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.baseRateCents).toBe(1499);
    });

    it('PUT /business/rates/:id returns 404 for unknown rate', async () => {
      const resp = await client.put(`/business/rates/${UNKNOWN_ID}`, { baseRateCents: 100 }, auth());
      expectStatus(resp, 404);
    });

    it('DELETE /business/rates/:id removes the rate', async () => {
      const resp = await client.delete(`/business/rates/${rateId}`, auth());
      expectStatus(resp, 200);
      const get = await client.get(`/business/rates/${rateId}`, auth());
      expect(get.status).toBe(404);
    });
  });

  describe('Surcharges', () => {
    let surchargeId = '';

    it('GET /business/rates/:rateId/surcharges lists (empty before create)', async () => {
      const resp = await client.get(`/business/rates/${SEEDED_RATE_IDS.UPS_GROUND_US}/surcharges`, auth());
      expectStatus(resp, 200);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('POST /business/surcharges creates a surcharge', async () => {
      const resp = await client.post(
        '/business/surcharges',
        {
          shippingRateId: SEEDED_RATE_IDS.UPS_GROUND_US,
          type: 'fuel',
          calculationType: 'percentage',
          value: '5.00',
          isActive: true,
        },
        auth(),
      );
      expectStatus(resp, 201);
      surchargeId = (resp.data.data.shippingSurchargeId || resp.data.data.id) as string;
      expect(surchargeId).toBeTruthy();
    });

    it('GET /business/rates/:rateId/surcharges includes the created surcharge', async () => {
      const resp = await client.get(`/business/rates/${SEEDED_RATE_IDS.UPS_GROUND_US}/surcharges`, auth());
      expectStatus(resp, 200);
      const list = resp.data.data as Array<Record<string, unknown>>;
      expect(list.some(s => s.shippingSurchargeId === surchargeId)).toBe(true);
    });

    it('GET /business/surcharges/:id returns the surcharge', async () => {
      const resp = await client.get(`/business/surcharges/${surchargeId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.type).toBe('fuel');
    });

    it('PUT /business/surcharges/:id updates the surcharge', async () => {
      const resp = await client.put(`/business/surcharges/${surchargeId}`, { value: '7.50', isActive: false }, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.value).toBe('7.50');
      expect(resp.data.data.isActive).toBe(false);
    });

    it('DELETE /business/surcharges/:id removes the surcharge', async () => {
      const resp = await client.delete(`/business/surcharges/${surchargeId}`, auth());
      expectStatus(resp, 200);
      const get = await client.get(`/business/surcharges/${surchargeId}`, auth());
      expect(get.status).toBe(404);
    });
  });

  describe('Labels and tracking', () => {
    let labelId = '';

    it('POST /business/labels creates a label', async () => {
      const resp = await client.post(
        '/business/labels',
        {
          shippingCarrierId: SEEDED_CARRIER_IDS.UPS,
          carrierService: 'ground',
          trackingNumber: `TRK-NEW-${Date.now()}`,
          orderId: '00000000-0000-0000-0000-000000000200',
          shipToName: 'Coverage Buyer',
          shipToAddressLine1: '2 Coverage Ave',
          shipToCity: 'Portland',
          shipToState: 'OR',
          shipToPostalCode: '97201',
          shipToCountry: 'US',
          weight: '1.0',
          shippingCost: 500,
        },
        auth(),
      );
      expectStatus(resp, 201);
      labelId = (resp.data.data.shippingLabelId || resp.data.data.id) as string;
      expect(labelId).toBeTruthy();
    });

    it('POST /business/labels rejects an unknown carrier', async () => {
      const resp = await client.post('/business/labels', { shippingCarrierId: UNKNOWN_ID }, auth());
      expect(resp.status).toBeGreaterThanOrEqual(400);
      expect(resp.data.success).toBe(false);
    });

    it('GET /business/labels/:id returns the created label', async () => {
      const resp = await client.get(`/business/labels/${labelId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.shippingLabelId).toBe(labelId);
    });

    it('GET /business/track/:id returns tracking for the seeded label', async () => {
      const resp = await client.get(`/business/track/${SEEDED_LABEL_ID}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.trackingNumber).toBe(SEEDED_TRACKING);
      expect(resp.data.data.status).toBe('created');
    });

    it('GET /business/track?trackingNumber= resolves by tracking number', async () => {
      const resp = await client.get(`/business/track?trackingNumber=${SEEDED_TRACKING}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.shippingLabelId).toBe(SEEDED_LABEL_ID);
    });

    it('GET /business/track returns 404 for unknown tracking', async () => {
      const resp = await client.get('/business/track?trackingNumber=TRK-NOPE-000', auth());
      expectStatus(resp, 404);
    });
  });

  describe('Public customer surface', () => {
    it('GET /customer/methods lists shipping methods', async () => {
      const resp = await client.get('/customer/methods');
      expectStatus(resp, 200);
      const methods = resp.data.data as Array<Record<string, unknown>>;
      expect(methods.length).toBeGreaterThan(0);
    });

    it('GET /customer/packaging-types lists packaging types', async () => {
      const resp = await client.get('/customer/packaging-types');
      expectStatus(resp, 200);
      const types = resp.data.data as Array<Record<string, unknown>>;
      expect(types.length).toBeGreaterThan(0);
    });

    it('POST /customer/calculate-rates returns rates for a US destination', async () => {
      const resp = await client.post('/customer/calculate-rates', {
        destinationAddress: { country: 'US', postalCode: '97201' },
        orderDetails: { subtotal: 150, itemCount: 2 },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('POST /customer/calculate-rates requires destinationAddress and orderDetails', async () => {
      const resp = await client.post('/customer/calculate-rates', { orderDetails: { subtotal: 10 } });
      expectStatus(resp, 400);
    });
  });
});
