/**
 * Seed test orders for integration tests
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_ORDER_ID = '00000000-0000-0000-0000-000000000200';

exports.seed = async function (knex) {
  // Get the test customer ID
  const testCustomer = await knex('customer').where({ email: 'customer@example.com' }).first('customerId');

  // Delete existing test order and items
  await knex('orderItem').where({ orderId: TEST_ORDER_ID }).del();
  await knex('order').where({ orderId: TEST_ORDER_ID }).del();

  // Insert test order
  await knex('order').insert({
    orderId: TEST_ORDER_ID,
    orderNumber: 'TEST-ORDER-001',
    customerId: testCustomer.customerId,
    status: 'pending',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    currencyCode: 'USD',
    subtotal: 99.99,
    discountTotal: 10.0,
    taxTotal: 7.5,
    shippingTotal: 5.99,
    handlingFee: 0,
    totalAmount: 103.48,
    totalItems: 2,
    totalQuantity: 3,
    taxExempt: false,
    orderDate: knex.fn.now(),
    customerEmail: 'customer@example.com',
    customerPhone: '555-123-4567',
    customerName: 'Test Customer',
    hasGiftWrapping: false,
    isGift: false,
    isSubscriptionOrder: false,
    shippingAddress: JSON.stringify({
      firstName: 'Test',
      lastName: 'Customer',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    }),
    billingAddress: JSON.stringify({
      firstName: 'Test',
      lastName: 'Customer',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    }),
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });

  // Insert test order item (productId is nullable, so we can skip it)
  await knex('orderItem').insert({
    orderId: TEST_ORDER_ID,
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    quantity: 2,
    unitPrice: 49.99,
    discountedUnitPrice: 44.99,
    lineTotal: 89.98,
    discountTotal: 10.0,
    taxTotal: 7.5,
    fulfillmentStatus: 'unfulfilled',
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
};
