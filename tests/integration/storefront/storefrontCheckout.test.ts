/**
 * Storefront Checkout Flow Integration Tests
 *
 * Covers the EJS storefront checkout surface (no prior coverage — the suite
 * previously only exercised the REST API):
 * - Guest: add to basket → session persists → checkout → order-confirmation
 * - Guest order-confirmation is session-scoped (no session → /signin redirect)
 * - Authed: guest basket merges on POST /signin → checkout as customer
 */

import { AxiosInstance } from 'axios';
import { createTestClient, expectStatus } from '../testUtils';
import { TEST_PRODUCT_1_ID, CUSTOMER_CREDENTIALS } from '../testConstants';

const SHIPPING_ADDRESS_JSON = JSON.stringify({
  firstName: 'Test',
  lastName: 'Buyer',
  addressLine1: '1 Commerce Way',
  city: 'Testville',
  state: 'TS',
  postalCode: '12345',
  country: 'US',
});

/** Extracts the sesId cookie pair from a response's set-cookie header. */
function sessionCookie(resp: { headers: Record<string, unknown> }): string | null {
  const setCookie = resp.headers['set-cookie'] as string[] | undefined;
  const ses = setCookie?.find(c => c.startsWith('sesId='));
  return ses ? ses.split(';')[0] : null;
}

/**
 * Minimal cookie jar. axios does not persist cookies across redirects, so a
 * 302 that sets sesId must be captured with maxRedirects: 0 — following the
 * redirect would mint a NEW session and lose the basket's session.
 */
function jarFrom(...resps: Array<{ headers: Record<string, unknown> }>): { Cookie: string } {
  const jar = new Map<string, string>();
  for (const resp of resps) {
    const setCookie = (resp.headers['set-cookie'] as string[] | undefined) ?? [];
    for (const c of setCookie) {
      const [pair] = c.split(';');
      const idx = pair.indexOf('=');
      jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1));
    }
  }
  return { Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') };
}

describe('Storefront Checkout Flow', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = createTestClient();
  });

  it('issues a guest session cookie on basket add', async () => {
    const resp = await client.post(`/basket/add/${TEST_PRODUCT_1_ID}`, { quantity: 1 }, { maxRedirects: 0 });
    expect(resp.status).toBe(302);
    expect(decodeURIComponent(resp.headers.location as string)).toContain('/basket');
    expect(sessionCookie(resp)).toMatch(/^sesId=/);
  });

  it('redirects guest checkout to basket when cart is empty', async () => {
    const resp = await client.get('/checkout', { maxRedirects: 0 });
    expect(resp.status).toBe(302);
    expect(resp.headers.location).toContain('/basket');
  });

  it('completes a full guest checkout and views order confirmation', async () => {
    const add = await client.post(`/basket/add/${TEST_PRODUCT_1_ID}`, { quantity: 1 }, { maxRedirects: 0 });
    expect(add.status).toBe(302);
    const jar = jarFrom(add);

    const checkoutPage = await client.get('/checkout', { headers: jar, maxRedirects: 0 });
    expect(checkoutPage.status).toBe(200);

    const placed = await client.post(
      '/checkout',
      {
        guestEmail: 'guest-shopper@example.com',
        shippingAddress: SHIPPING_ADDRESS_JSON,
        billingAddress: SHIPPING_ADDRESS_JSON,
      },
      { headers: jar },
    );
    expectStatus(placed, 200);
    expect(placed.data.success).toBe(true);
    const orderId = placed.data.orderId as string;
    expect(orderId).toBeDefined();

    const confirmation = await client.get(`/order-confirmation/${orderId}`, { headers: jar });
    expectStatus(confirmation, 200);
  });

  it('rejects guest order-confirmation for another session', async () => {
    const add = await client.post(`/basket/add/${TEST_PRODUCT_1_ID}`, { quantity: 1 }, { maxRedirects: 0 });
    const jar = jarFrom(add);

    const placed = await client.post(
      '/checkout',
      { guestEmail: 'other-guest@example.com', shippingAddress: SHIPPING_ADDRESS_JSON },
      { headers: jar },
    );
    expectStatus(placed, 200);
    const orderId = placed.data.orderId as string;

    // No session → redirect to signin (order belongs to the placing session only)
    const anonymous = await client.get(`/order-confirmation/${orderId}`, { maxRedirects: 0 });
    expect(anonymous.status).toBe(302);
    expect(anonymous.headers.location).toBe('/signin');
  });

  it('requires an email for guest checkout', async () => {
    const add = await client.post(`/basket/add/${TEST_PRODUCT_1_ID}`, { quantity: 1 }, { maxRedirects: 0 });
    const jar = jarFrom(add);

    const resp = await client.post('/checkout', { shippingAddress: SHIPPING_ADDRESS_JSON }, { headers: jar });
    expectStatus(resp, 400);
    expect(resp.data.message).toMatch(/email/i);
  });

  it('merges the guest basket on signin and checks out as the customer', async () => {
    // Guest adds an item — basket is session-scoped
    const add = await client.post(`/basket/add/${TEST_PRODUCT_1_ID}`, { quantity: 2 }, { maxRedirects: 0 });
    const jar = jarFrom(add);

    // Sign in on the same session — triggers guest→customer basket merge.
    // The signin response re-issues sesId with the user payload — keep it.
    const signin = await client.post(
      '/signin',
      { email: CUSTOMER_CREDENTIALS.email, password: CUSTOMER_CREDENTIALS.password },
      { headers: jar, maxRedirects: 0 },
    );
    expect(signin.status).toBe(302);
    const authedJar = jarFrom(add, signin);

    // Authed checkout: if the merge failed the customer basket would be empty → 400
    const placed = await client.post('/checkout', { shippingAddress: SHIPPING_ADDRESS_JSON }, { headers: authedJar });
    expectStatus(placed, 200);
    expect(placed.data.success).toBe(true);
    expect(placed.data.orderId).toBeDefined();

    // The customer can view their own order confirmation via session auth
    const confirmation = await client.get(`/order-confirmation/${placed.data.orderId}`, { headers: authedJar });
    expectStatus(confirmation, 200);
  });
});
