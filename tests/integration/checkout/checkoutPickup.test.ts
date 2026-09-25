/**
 * Checkout Pickup & Local Delivery Integration Tests
 *
 * Covers the BOPIS/local-delivery checkout surface (previously uncovered):
 * - GET    /customer/checkout/pickup-locations (list + geo-nearest)
 * - PUT    /customer/checkout/:id/pickup-location (BOPIS selection)
 * - GET    /customer/checkout/:id/pickup-slots (time slots after pickup set)
 * - GET    /customer/checkout/:id/local-delivery-options (eligibility)
 *
 * The seeded pickup location lives on "Active Test Store"
 * (20000000-0000-0000-0000-000000000001); no seeded store enables
 * localDelivery, so eligibility deterministically returns eligible:false.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser, expectStatus } from '../testUtils';
import { TEST_PICKUP_LOCATION_ID, TEST_SHIPPING_ADDRESS } from '../testConstants';

// Pool of seeded single-use baskets — checkout consumes a basket on initiate.
const CHECKOUT_BASKET_POOL = Array.from({ length: 20 }, (_, i) => `00000000-0000-0000-0000-0000000031${String(i).padStart(2, '0')}`);

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Checkout Pickup & Local Delivery', () => {
  let client: AxiosInstance;
  let auth: { headers: Record<string, string> };

  const newCheckoutSession = async (): Promise<string> => {
    const basketId = CHECKOUT_BASKET_POOL.shift();
    const resp = await client.post('/customer/checkout', { basketId }, auth);
    expectStatus(resp, 201);
    return resp.data.data.checkoutId as string;
  };

  beforeAll(async () => {
    client = createTestClient();
    const token = await loginTestUser(client);
    auth = { headers: { Authorization: `Bearer ${token}` } };
  });

  describe('GET /customer/checkout/pickup-locations', () => {
    it('lists pickup locations including the seeded location', async () => {
      const resp = await client.get('/customer/checkout/pickup-locations', auth);
      expectStatus(resp, 200);
      const locations = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(locations)).toBe(true);
      const seeded = locations.find(l => l.locationId === TEST_PICKUP_LOCATION_ID);
      expect(seeded).toBeDefined();
      expect(seeded?.storeName).toBe('Downtown Pickup Counter');
    });

    it('returns nearest locations for a geo query within radius', async () => {
      const resp = await client.get('/customer/checkout/pickup-locations?latitude=45.51&longitude=-122.67&radius=10', auth);
      expectStatus(resp, 200);
      const locations = resp.data.data as Array<Record<string, unknown>>;
      const seeded = locations.find(l => l.locationId === TEST_PICKUP_LOCATION_ID);
      expect(seeded).toBeDefined();
    });

    it('excludes the seeded location when far outside radius', async () => {
      const resp = await client.get('/customer/checkout/pickup-locations?latitude=40.71&longitude=-74.0&radius=5', auth);
      expectStatus(resp, 200);
      const locations = resp.data.data as Array<Record<string, unknown>>;
      expect(locations.find(l => l.locationId === TEST_PICKUP_LOCATION_ID)).toBeUndefined();
    });
  });

  describe('PUT /customer/checkout/:id/pickup-location', () => {
    it('rejects a missing pickupLocationId', async () => {
      const checkoutId = await newCheckoutSession();
      const resp = await client.put(`/customer/checkout/${checkoutId}/pickup-location`, {}, auth);
      expectStatus(resp, 400);
    });

    it('rejects an unknown pickup location', async () => {
      const checkoutId = await newCheckoutSession();
      const resp = await client.put(
        `/customer/checkout/${checkoutId}/pickup-location`,
        { pickupLocationId: UNKNOWN_ID },
        auth,
      );
      expectStatus(resp, 404);
    });

    it('rejects an unknown checkout session', async () => {
      const resp = await client.put(
        `/customer/checkout/${UNKNOWN_ID}/pickup-location`,
        { pickupLocationId: TEST_PICKUP_LOCATION_ID },
        auth,
      );
      expectStatus(resp, 404);
    });

    it('sets BOPIS fulfillment and stores pickup metadata', async () => {
      const checkoutId = await newCheckoutSession();
      const resp = await client.put(
        `/customer/checkout/${checkoutId}/pickup-location`,
        { pickupLocationId: TEST_PICKUP_LOCATION_ID },
        auth,
      );
      expectStatus(resp, 200);
      expect(resp.data.data.fulfillmentType).toBe('pickup');
      const metadata = resp.data.data.metadata as Record<string, unknown>;
      expect(metadata.pickupLocationId).toBe(TEST_PICKUP_LOCATION_ID);
      expect(metadata.pickupStoreId).toBe('20000000-0000-0000-0000-000000000001');
    });
  });

  describe('GET /customer/checkout/:id/pickup-slots', () => {
    it('requires a pickup location before returning slots', async () => {
      const checkoutId = await newCheckoutSession();
      const resp = await client.get(`/customer/checkout/${checkoutId}/pickup-slots`, auth);
      expectStatus(resp, 400);
    });

    it('returns bookable slots once a pickup location is set', async () => {
      const checkoutId = await newCheckoutSession();
      const set = await client.put(
        `/customer/checkout/${checkoutId}/pickup-location`,
        { pickupLocationId: TEST_PICKUP_LOCATION_ID },
        auth,
      );
      expectStatus(set, 200);

      const resp = await client.get(`/customer/checkout/${checkoutId}/pickup-slots?days=3`, auth);
      expectStatus(resp, 200);
      const slots = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
    });

    it('rejects an unknown checkout session', async () => {
      const resp = await client.get(`/customer/checkout/${UNKNOWN_ID}/pickup-slots`, auth);
      expectStatus(resp, 404);
    });
  });

  describe('GET /customer/checkout/:id/local-delivery-options', () => {
    it('requires a shipping address first', async () => {
      const checkoutId = await newCheckoutSession();
      const resp = await client.get(`/customer/checkout/${checkoutId}/local-delivery-options`, auth);
      expectStatus(resp, 400);
    });

    it('returns ineligibility when no store enables local delivery', async () => {
      const checkoutId = await newCheckoutSession();
      const addr = await client.put(`/customer/checkout/${checkoutId}/shipping-address`, TEST_SHIPPING_ADDRESS, auth);
      expectStatus(addr, 200);

      const resp = await client.get(`/customer/checkout/${checkoutId}/local-delivery-options`, auth);
      expectStatus(resp, 200);
      expect(resp.data.data.eligible).toBe(false);
      expect(Array.isArray(resp.data.data.options)).toBe(true);
      expect(resp.data.data.options).toHaveLength(0);
    });

    it('rejects an unknown checkout session', async () => {
      const resp = await client.get(`/customer/checkout/${UNKNOWN_ID}/local-delivery-options`, auth);
      expectStatus(resp, 404);
    });
  });
});
