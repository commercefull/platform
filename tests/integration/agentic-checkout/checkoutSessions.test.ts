/**
 * Integration tests for agentic-checkout ACP endpoints (/acp).
 *
 * Uses the seeded test channel (seeds/20261001130000_seedAgenticCheckoutTestData.js):
 *   Bearer key:      acp-test-key-12345
 *   Signing secret:  acp-test-signing-secret-67890
 *
 * The channel has a signing secret configured, so every request must carry a
 * valid `Signature`/`Timestamp` HMAC-SHA256 over `${timestamp}.${rawBody}`.
 */

import { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { createTestClient, expectStatus } from '../testUtils';
import { SEEDED_PRODUCT_1_ID } from '../product/testUtils';

const ACP_KEY = 'acp-test-key-12345';
const ACP_SECRET = 'acp-test-signing-secret-67890';

const ADDRESS = {
  line_one: '1 Main St',
  city: 'Springfield',
  region: 'IL',
  country: 'US',
  postal_code: '62701',
};

// The checkout domain requires first/last name on the shipping address —
// surfaces send it via `buyer` alongside `fulfillment_details.address`.
const BUYER = { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com' };

const FULFILLMENT_UPDATE = { buyer: BUYER, fulfillment_details: { address: ADDRESS } };

function sign(rawBody: string): { Signature: string; Timestamp: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac('sha256', ACP_SECRET).update(`${timestamp}.${rawBody}`).digest('hex');
  return { Signature: signature, Timestamp: timestamp };
}

function acpHeaders(rawBody = '', extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${ACP_KEY}`, ...sign(rawBody), ...extra };
}

function acpPost(client: AxiosInstance, path: string, payload: unknown, idempotencyKey: string, extraHeaders: Record<string, string> = {}) {
  const raw = JSON.stringify(payload);
  return client.post(path, raw, {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...acpHeaders(raw),
      ...extraHeaders,
    },
  });
}

function acpGet(client: AxiosInstance, path: string, extraHeaders: Record<string, string> = {}) {
  return client.get(path, { headers: acpHeaders('', extraHeaders) });
}

let keyCounter = 0;
function idemKey(): string {
  return `test-${Date.now()}-${keyCounter++}`;
}

async function createSession(client: AxiosInstance) {
  const res = await acpPost(
    client,
    '/acp/checkout_sessions',
    { items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 1 }], buyer: BUYER },
    idemKey(),
  );
  expectStatus(res, 201);
  return res.data as { id: string; status: string; line_items: unknown[] };
}

describe('Agentic Checkout — ACP endpoints', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = createTestClient();
  });

  // ==========================================================================
  // Authentication & signature verification
  // ==========================================================================
  describe('Authentication', () => {
    it('should reject requests without an Authorization header as problem+json 401', async () => {
      const res = await client.get('/acp/feed');

      expectStatus(res, 401);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.data.code).toBe('agenticCheckout.unauthenticated');
    });

    it('should reject a malformed Authorization header', async () => {
      const res = await client.get('/acp/feed', { headers: { Authorization: 'Basic abc' } });

      expectStatus(res, 401);
      expect(res.data.code).toBe('agenticCheckout.unauthenticated');
    });

    it('should reject an unknown bearer key', async () => {
      const res = await client.get('/acp/feed', {
        headers: { Authorization: 'Bearer not-a-real-key', ...sign('') },
      });

      expectStatus(res, 401);
      expect(res.data.code).toBe('agenticCheckout.unauthenticated');
    });

    it('should reject a request with an invalid signature', async () => {
      const res = await client.get('/acp/feed', {
        headers: {
          Authorization: `Bearer ${ACP_KEY}`,
          Signature: 'deadbeef',
          Timestamp: Math.floor(Date.now() / 1000).toString(),
        },
      });

      expectStatus(res, 401);
      expect(res.data.code).toBe('agenticCheckout.signature_invalid');
    });

    it('should reject a stale timestamp outside the freshness window', async () => {
      const ts = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString();
      const signature = createHmac('sha256', ACP_SECRET).update(`${ts}.`).digest('hex');
      const res = await client.get('/acp/feed', {
        headers: { Authorization: `Bearer ${ACP_KEY}`, Signature: signature, Timestamp: ts },
      });

      expectStatus(res, 401);
      expect(res.data.code).toBe('agenticCheckout.signature_invalid');
    });
  });

  // ==========================================================================
  // POST /acp/checkout_sessions
  // ==========================================================================
  describe('POST /acp/checkout_sessions', () => {
    it('should require Idempotency-Key on POST requests', async () => {
      const raw = JSON.stringify({ items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 1 }] });
      const res = await client.post('/acp/checkout_sessions', raw, {
        headers: { 'Content-Type': 'application/json', ...acpHeaders(raw) },
      });

      expectStatus(res, 400);
      expect(res.data.code).toBe('agenticCheckout.idempotency_key_required');
    });

    it('should create a session with authoritative totals and line items', async () => {
      const res = await acpPost(client, '/acp/checkout_sessions', { items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 2 }] }, idemKey());

      expectStatus(res, 201);
      expect(res.headers['api-version']).toBe('2026-04-17');
      expect(res.headers['idempotency-key']).toBeTruthy();
      expect(res.data.id).toBeTruthy();
      expect(res.data.status).toBe('not_ready_for_payment');
      expect(res.data.line_items).toHaveLength(1);
      expect(res.data.line_items[0].item).toMatchObject({ id: SEEDED_PRODUCT_1_ID, quantity: 2 });
      // Effective pricing comes from the pricing module — assert the contract,
      // not a specific seeded price (promotions may adjust it).
      const baseAmount = res.data.line_items[0].base_amount as number;
      expect(baseAmount).toBeGreaterThan(0);
      expect(res.data.line_items[0].total).toBe(baseAmount * 2);
      const total = res.data.totals.find((t: { type: string }) => t.type === 'total');
      expect(total.amount).toBeGreaterThanOrEqual(baseAmount * 2);
    });

    it('should reject an items entry with a non-purchasable product id', async () => {
      const res = await acpPost(
        client,
        '/acp/checkout_sessions',
        { items: [{ id: '00000000-0000-0000-0000-00000000dead', quantity: 1 }] },
        idemKey(),
      );

      expectStatus(res, 422);
      expect(res.data.code).toBe('agenticCheckout.catalog_error');
    });

    it('should reject an empty items array', async () => {
      const res = await acpPost(client, '/acp/checkout_sessions', { items: [] }, idemKey());

      expectStatus(res, 400);
      expect(res.data.code).toBe('agenticCheckout.validation_error');
    });

    it('should replay the stored response for a repeated Idempotency-Key + identical payload', async () => {
      const key = idemKey();
      const payload = { items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 1 }] };

      const first = await acpPost(client, '/acp/checkout_sessions', payload, key);
      const second = await acpPost(client, '/acp/checkout_sessions', payload, key);

      expectStatus(first, 201);
      expectStatus(second, 201);
      expect(second.headers['idempotent-replayed']).toBe('true');
      expect(second.data.id).toBe(first.data.id);
    });

    it('should reject a reused Idempotency-Key with a different payload', async () => {
      const key = idemKey();

      const first = await acpPost(client, '/acp/checkout_sessions', { items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 1 }] }, key);
      expectStatus(first, 201);

      const conflict = await acpPost(client, '/acp/checkout_sessions', { items: [{ id: SEEDED_PRODUCT_1_ID, quantity: 3 }] }, key);
      expectStatus(conflict, 422);
      expect(conflict.data.code).toBe('agenticCheckout.idempotency_conflict');
    });
  });

  // ==========================================================================
  // GET /acp/checkout_sessions/:id
  // ==========================================================================
  describe('GET /acp/checkout_sessions/:id', () => {
    it('should return the created session', async () => {
      const created = await createSession(client);

      const res = await acpGet(client, `/acp/checkout_sessions/${created.id}`);

      expectStatus(res, 200);
      expect(res.data.id).toBe(created.id);
      expect(res.data.line_items).toHaveLength(1);
    });

    it('should return 404 for an unknown session id', async () => {
      const res = await acpGet(client, '/acp/checkout_sessions/00000000-0000-0000-0000-00000000beef');

      expectStatus(res, 404);
      expect(res.data.code).toBe('agenticCheckout.session_not_found');
    });
  });

  // ==========================================================================
  // POST /acp/checkout_sessions/:id — update
  // ==========================================================================
  describe('POST /acp/checkout_sessions/:id (update)', () => {
    it('should apply the fulfillment address and return shipping options + tax', async () => {
      const created = await createSession(client);

      const res = await acpPost(client, `/acp/checkout_sessions/${created.id}`, FULFILLMENT_UPDATE, idemKey());

      expectStatus(res, 200);
      expect(res.data.fulfillment_details?.address).toMatchObject({ city: 'Springfield', country: 'US' });
      expect(res.data.buyer).toMatchObject({ first_name: 'Ada', last_name: 'Lovelace' });
      expect(res.data.fulfillment_options?.length).toBeGreaterThan(0);
      expect(res.data.totals.find((t: { type: string }) => t.type === 'tax')).toBeTruthy();
    });

    it('should transition to ready_for_payment after selecting a fulfillment option', async () => {
      const created = await createSession(client);
      const withAddress = await acpPost(client, `/acp/checkout_sessions/${created.id}`, FULFILLMENT_UPDATE, idemKey());
      expectStatus(withAddress, 200);
      const optionId = withAddress.data.fulfillment_options?.[0]?.id;
      expect(optionId).toBeTruthy();

      const res = await acpPost(client, `/acp/checkout_sessions/${created.id}`, { fulfillment_option_id: optionId }, idemKey());

      expectStatus(res, 200);
      expect(res.data.status).toBe('ready_for_payment');
    });

    it('should return 404 when updating a session owned by another channel', async () => {
      const res = await acpPost(client, '/acp/checkout_sessions/00000000-0000-0000-0000-00000000beef', FULFILLMENT_UPDATE, idemKey());

      expectStatus(res, 404);
      expect(res.data.code).toBe('agenticCheckout.session_not_found');
    });
  });

  // ==========================================================================
  // POST /acp/checkout_sessions/:id/complete
  // ==========================================================================
  describe('POST /acp/checkout_sessions/:id/complete', () => {
    it('should reject completion without payment_data.instrument.credential', async () => {
      const created = await createSession(client);

      const res = await acpPost(client, `/acp/checkout_sessions/${created.id}/complete`, { buyer: { email: 'a@b.c' } }, idemKey());

      expectStatus(res, 400);
      expect(res.data.code).toBe('agenticCheckout.payment_failed');
    });

    it('should fail cleanly (402) on a declined delegated credential and keep the session retryable', async () => {
      const created = await createSession(client);
      const withAddress = await acpPost(client, `/acp/checkout_sessions/${created.id}`, FULFILLMENT_UPDATE, idemKey());
      const optionId = withAddress.data.fulfillment_options?.[0]?.id;
      if (optionId) {
        await acpPost(client, `/acp/checkout_sessions/${created.id}`, { fulfillment_option_id: optionId }, idemKey());
      }

      const res = await acpPost(
        client,
        `/acp/checkout_sessions/${created.id}/complete`,
        {
          payment_data: {
            handler_id: 'stripe',
            instrument: { credential: { type: 'spt', token: 'spt_test_declined' } },
          },
        },
        idemKey(),
      );

      // The seeded test gateway holds a fake Stripe key, so the delegated
      // charge always declines — the contract under test is the failure shape.
      expectStatus(res, 402);
      expect(res.data.code).toBe('payment.delegated_charge_failed');

      const after = await acpGet(client, `/acp/checkout_sessions/${created.id}`);
      // Declined payment reverts the session to an active (retryable) state
      expect(after.data.status === 'incomplete' || after.data.status === 'ready_for_payment').toBe(true);
    });

    it('should return 404 when completing a session owned by another channel', async () => {
      const res = await acpPost(
        client,
        '/acp/checkout_sessions/00000000-0000-0000-0000-00000000beef/complete',
        { payment_data: { instrument: { credential: { type: 'spt', token: 'x' } } } },
        idemKey(),
      );

      expectStatus(res, 404);
      expect(res.data.code).toBe('agenticCheckout.session_not_found');
    });
  });

  // ==========================================================================
  // POST /acp/checkout_sessions/:id/cancel
  // ==========================================================================
  describe('POST /acp/checkout_sessions/:id/cancel', () => {
    it('should cancel an active session', async () => {
      const created = await createSession(client);

      const res = await acpPost(client, `/acp/checkout_sessions/${created.id}/cancel`, {}, idemKey());

      expectStatus(res, 200);
      expect(res.data.status).toBe('canceled');
    });

    it('should reject mutating a canceled session', async () => {
      const created = await createSession(client);
      await acpPost(client, `/acp/checkout_sessions/${created.id}/cancel`, {}, idemKey());

      const res = await acpPost(client, `/acp/checkout_sessions/${created.id}`, FULFILLMENT_UPDATE, idemKey());

      expectStatus(res, 409);
      expect(res.data.code).toBe('agenticCheckout.session_not_mutable');
    });
  });

  // ==========================================================================
  // GET /acp/feed
  // ==========================================================================
  describe('GET /acp/feed', () => {
    it('should return the ACP product feed for the channel store', async () => {
      const res = await acpGet(client, '/acp/feed');

      expectStatus(res, 200);
      expect(res.data.version).toBe('acp.feed.1');
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(res.data.items.length).toBeGreaterThan(0);
      const item = res.data.items[0];
      expect(item).toMatchObject({ id: expect.any(String), title: expect.any(String) });
      expect(item.price).toMatch(/^\d+\.\d{2} [A-Z]{3}$/);
      expect(item.availability === 'in_stock' || item.availability === 'out_of_stock').toBe(true);
    });
  });
});
