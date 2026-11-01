/**
 * Regional Checkout Integration Tests
 *
 * Seeded end-to-end coverage for the enterprise regional scenario:
 * storefront store/channel resolution (?store=), basket and order
 * attribution, and region-correct tax behavior — tax-exclusive US
 * checkout vs VAT-inclusive UK checkout.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser, loginTestAdmin, expectStatus } from '../testUtils';

const PRODUCT_ID = '00000000-0000-0000-0000-000000000001';

const US_STORE = { slug: 'enterprise-us-ca', storeId: '41000000-0000-7000-8000-000000000002', currency: 'USD' };
const UK_STORE = { slug: 'enterprise-uk', storeId: '41000000-0000-7000-8000-000000000004', currency: 'GBP' };
const DE_STORE = { slug: 'enterprise-eu-de', storeId: '41000000-0000-7000-8000-000000000005', currency: 'EUR' };
const WEBSITE_CHANNEL_ID = '42000000-0000-7000-8000-000000000001';

describe('Regional Checkout Integration', () => {
  let client: AxiosInstance;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(60000);
    client = createTestClient();
    customerToken = await loginTestUser(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  const createBasket = async (storeSlug: string, currency?: string): Promise<Record<string, unknown>> => {
    const response = await client.post(`/customer/basket?store=${storeSlug}`, currency ? { currency } : {}, { headers: authHeaders() });
    expectStatus(response, 201);
    return response.data.data;
  };

  const checkoutToPaymentIntent = async (
    basketId: string,
    address: Record<string, string>,
    vatNumber?: string,
  ): Promise<{ orderId: string; vatResponse?: Record<string, unknown> }> => {
    const itemResponse = await client.post(
      `/customer/basket/${basketId}/items`,
      { productId: PRODUCT_ID, quantity: 1 },
      { headers: authHeaders() },
    );
    expectStatus(itemResponse, 201);

    const checkoutResponse = await client.post('/customer/checkout', { basketId }, { headers: authHeaders() });
    expectStatus(checkoutResponse, 201);
    const checkoutId = checkoutResponse.data.data.checkoutId;

    const addressResponse = await client.put(`/customer/checkout/${checkoutId}/shipping-address`, address, {
      headers: authHeaders(),
    });
    expectStatus(addressResponse, 200);

    let vatResponse: Record<string, unknown> | undefined;
    if (vatNumber) {
      const response = await client.put(`/customer/checkout/${checkoutId}/vat-number`, { vatNumber }, { headers: authHeaders() });
      expectStatus(response, 200);
      vatResponse = response.data.data;
    }

    const methodsResponse = await client.get(`/customer/checkout/${checkoutId}/shipping-methods`, {
      headers: authHeaders(),
    });
    expectStatus(methodsResponse, 200);
    const pricedMethods = (methodsResponse.data.data as Array<{ id: string; priceCents: number }>).filter(method => method.priceCents > 0);
    const method = pricedMethods[0] ?? (methodsResponse.data.data as Array<{ id: string }>)[0];

    const methodResponse = await client.put(
      `/customer/checkout/${checkoutId}/shipping-method`,
      { shippingMethodId: method.id },
      { headers: authHeaders() },
    );
    expectStatus(methodResponse, 200);

    const intentResponse = await client.post(
      `/customer/checkout/${checkoutId}/payment-intent`,
      { paymentMethodId: 'cod' },
      { headers: authHeaders() },
    );
    expectStatus(intentResponse, 201);
    return { orderId: intentResponse.data.data.orderId, vatResponse };
  };

  const getOrder = async (orderId: string): Promise<Record<string, number | string>> => {
    const response = await client.get(`/customer/order/${orderId}`, { headers: authHeaders() });
    expectStatus(response, 200);
    return response.data.data;
  };

  it('should attribute basket and order to the US store and website channel with tax-exclusive totals', async () => {
    const basket = await createBasket(US_STORE.slug);
    expect(basket.storeId).toBe(US_STORE.storeId);
    expect(basket.channelId).toBe(WEBSITE_CHANNEL_ID);
    expect(basket.currency).toBe('USD');

    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'Los Angeles',
      region: 'CA',
      postalCode: '90012',
      country: 'US',
    });

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(US_STORE.storeId);
    expect(order.channelId).toBe(WEBSITE_CHANNEL_ID);
    expect(order.currencyCode).toBe('USD');
    // US destination sales tax is exclusive — added on top of subtotal+shipping
    expect(Number(order.taxTotalCents)).toBeGreaterThan(0);
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) + Number(order.taxTotalCents) - Number(order.discountTotalCents),
    );
  });

  it('should attribute basket and order to the UK store with VAT embedded in totals', async () => {
    const basket = await createBasket(UK_STORE.slug);
    expect(basket.storeId).toBe(UK_STORE.storeId);
    expect(basket.channelId).toBe(WEBSITE_CHANNEL_ID);
    expect(basket.currency).toBe('GBP');

    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '10 Downing St',
      city: 'London',
      postalCode: 'SW1A 2AA',
      country: 'GB',
    });

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(UK_STORE.storeId);
    expect(order.channelId).toBe(WEBSITE_CHANNEL_ID);
    expect(order.currencyCode).toBe('GBP');
    // UK VAT is included in listed prices — recorded for reporting but not added again
    expect(Number(order.taxTotalCents)).toBeGreaterThan(0);
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) - Number(order.discountTotalCents),
    );
  });

  it('should apply intra-EU reverse charge for a valid B2B VAT ID and carry it to the order', async () => {
    const basket = await createBasket(DE_STORE.slug);
    expect(basket.currency).toBe('EUR');

    const { orderId, vatResponse } = await checkoutToPaymentIntent(
      basket.basketId as string,
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        addressLine1: '1 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
      },
      'FR12345678901',
    );

    // Reverse charge zeroes the quote — the customer self-accounts French VAT
    expect(vatResponse?.reverseChargeApplied).toBe(true);
    expect(vatResponse?.vatNumber).toBe('FR12345678901');
    expect(vatResponse?.taxAmountCents).toBe(0);

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(DE_STORE.storeId);
    expect(Number(order.taxTotalCents)).toBe(0);
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) - Number(order.discountTotalCents),
    );
    const metadata = order.metadata as unknown as Record<string, unknown> | undefined;
    expect(metadata?.vatNumber).toBe('FR12345678901');
    expect(metadata?.reverseChargeApplied).toBe(true);
  });

  it('should charge destination VAT when the same cross-border order has no VAT ID', async () => {
    const basket = await createBasket(DE_STORE.slug);

    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Jean',
      lastName: 'Dupont',
      addressLine1: '1 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
    });

    const order = await getOrder(orderId);
    // French VAT is embedded in EUR prices — reported, not added on top
    expect(Number(order.taxTotalCents)).toBeGreaterThan(0);
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) - Number(order.discountTotalCents),
    );
  });

  it('should accept a region-optional Belgian address through the full checkout flow', async () => {
    const basket = await createBasket(DE_STORE.slug);

    // Belgium does not use administrative areas — no `region` field is sent
    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Marie',
      lastName: 'Peeters',
      addressLine1: 'Rue de la Loi 16',
      city: 'Brussels',
      postalCode: '1000',
      country: 'BE',
    });

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(DE_STORE.storeId);
    expect(order.currencyCode).toBe('EUR');
    // BE has no seeded tax rate — destination tax resolves to zero, but the
    // region-optional address must still flow through to a completed order.
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) + Number(order.taxTotalCents) - Number(order.discountTotalCents),
    );
  });

  it('should accept a postal-code-optional UAE address through the full checkout flow', async () => {
    const basket = await createBasket(DE_STORE.slug);

    // The UAE has no postal code system — the emirate is the administrative area
    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Fatima',
      lastName: 'Al Mansoori',
      addressLine1: 'Sheikh Zayed Road 1',
      city: 'Dubai',
      region: 'Dubai',
      country: 'AE',
    });

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(DE_STORE.storeId);
    expect(order.currencyCode).toBe('EUR');
  });

  it('should check out in JPY without multiplying zero-decimal minor units by 100', async () => {
    // US-CA store sells in JPY; the product has a native ¥1499 base price.
    const basket = await createBasket(US_STORE.slug, 'JPY');
    expect(basket.currency).toBe('JPY');

    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Yuki',
      lastName: 'Tanaka',
      addressLine1: '1-1 Chiyoda',
      city: 'Tokyo',
      region: 'Tokyo',
      postalCode: '100-0001',
      country: 'JP',
    });

    const order = await getOrder(orderId);
    expect(order.storeId).toBe(US_STORE.storeId);
    expect(order.currencyCode).toBe('JPY');
    // ¥1499 must remain 1499 minor units — a *100 assumption would yield 149900
    expect(Number(order.subtotalCents)).toBe(1499);
    // ¥800 flat JPY shipping rate from the Japan zone
    expect(Number(order.shippingTotalCents)).toBe(800);
    expect(Number(order.totalAmountCents)).toBe(
      Number(order.subtotalCents) + Number(order.shippingTotalCents) + Number(order.taxTotalCents) - Number(order.discountTotalCents),
    );
  });

  it('should expose order explainability with provenance for a taxed order', async () => {
    const adminToken = await loginTestAdmin(client);
    const basket = await createBasket(US_STORE.slug);

    const { orderId } = await checkoutToPaymentIntent(basket.basketId as string, {
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'Los Angeles',
      region: 'CA',
      postalCode: '90012',
      country: 'US',
    });

    const response = await client.get(`/business/orders/${orderId}/decisions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expectStatus(response, 200);

    const decisions = response.data.data as {
      orderId: string;
      orderNumber: string;
      currencyCode: string;
      decisionLog: unknown[];
      discounts: unknown[];
      taxes: Array<{ orderId: string }>;
    };
    expect(decisions.orderId).toBe(orderId);
    expect(decisions.currencyCode).toBe('USD');
    expect(Array.isArray(decisions.decisionLog)).toBe(true);
    expect(Array.isArray(decisions.discounts)).toBe(true);
    // The US destination-tax quote must be recorded as provenance rows
    expect(decisions.taxes.length).toBeGreaterThan(0);
    expect(decisions.taxes.every(tax => tax.orderId === orderId)).toBe(true);
  });

  it('should reject an invalid VAT number format', async () => {
    const basket = await createBasket(DE_STORE.slug);
    await client.post(`/customer/basket/${basket.basketId}/items`, { productId: PRODUCT_ID, quantity: 1 }, { headers: authHeaders() });
    const checkoutResponse = await client.post('/customer/checkout', { basketId: basket.basketId }, { headers: authHeaders() });
    const checkoutId = checkoutResponse.data.data.checkoutId;

    const response = await client.put(`/customer/checkout/${checkoutId}/vat-number`, { vatNumber: 'BAD' }, { headers: authHeaders() });

    expectStatus(response, 400);
  });

  it('should reject a basket channel that is not assigned to the resolved store', async () => {
    // The seeded 'us' store has no sales-channel assignments, so resolving it
    // leaves the channel to the request body — and any channel is unassigned.
    const response = await client.post('/customer/basket?store=us', { channelId: WEBSITE_CHANNEL_ID }, { headers: authHeaders() });

    expectStatus(response, 400);
  });
});
