/**
 * Seed test orders for integration tests
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_ORDER_ID = '00000000-0000-0000-0000-000000000200';
const TEST_ORDER_ITEM_ID = '00000000-0000-0000-0000-000000000010';
const TEST_ORDER_ITEM_2_ID = '00000000-0000-0000-0000-000000000011';
const TEST_ORDER_FULFILLMENT_ID = '00000000-0000-0000-0000-000000000210';
const TEST_ORDER_PACKAGE_ID = '00000000-0000-0000-0000-000000000211';
const TEST_REFUND_ORDER_ID = '00000000-0000-0000-0000-000000000201';
const TEST_REFUND_ORDER_PAYMENT_ID = '00000000-0000-0000-0000-000000000240';
const TEST_SHIPPED_ORDER_ID = '00000000-0000-0000-0000-000000000202';
const TEST_DELIVERED_ORDER_ID = '00000000-0000-0000-0000-000000000203';

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
    subtotalCents: 9999,
    discountTotalCents: 1000,
    taxTotalCents: 750,
    shippingTotalCents: 599,
    handlingFeeCents: 0,
    totalAmountCents: 10348,
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

  // Insert test order items (productId is nullable, so we can skip it)
  await knex('orderItem').insert([
    {
      orderItemId: TEST_ORDER_ITEM_ID,
      orderId: TEST_ORDER_ID,
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      quantity: 2,
      unitPriceCents: 4999,
      discountedUnitPriceCents: 4499,
      lineTotalCents: 8998,
      discountTotalCents: 1000,
      taxTotalCents: 750,
      fulfillmentStatus: 'unfulfilled',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      orderItemId: TEST_ORDER_ITEM_2_ID,
      orderId: TEST_ORDER_ID,
      sku: 'TEST-SKU-002',
      name: 'Test Product 2',
      quantity: 1,
      unitPriceCents: 1999,
      discountedUnitPriceCents: 1999,
      lineTotalCents: 1999,
      discountTotalCents: 0,
      taxTotalCents: 0,
      fulfillmentStatus: 'unfulfilled',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);

  // Order addresses (orderAddress table — repo reads shipping/billing by addressType)
  await knex('orderAddress').where({ orderId: TEST_ORDER_ID }).del();
  const orderAddress = {
    firstName: 'Test',
    lastName: 'Customer',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    phoneNumber: '555-123-4567',
    isDefault: false,
  };
  await knex('orderAddress').insert([
    { orderAddressId: '00000000-0000-0000-0000-000000000220', orderId: TEST_ORDER_ID, addressType: 'shipping', ...orderAddress, createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
    { orderAddressId: '00000000-0000-0000-0000-000000000221', orderId: TEST_ORDER_ID, addressType: 'billing', ...orderAddress, createdAt: knex.fn.now(), updatedAt: knex.fn.now() },
  ]);

  // Initial status history rows — mirror what a created order records
  await knex('orderStatusHistory').where({ orderId: TEST_ORDER_ID }).del();
  await knex('orderStatusHistory').insert({
    orderStatusHistoryId: '00000000-0000-0000-0000-000000000230',
    orderId: TEST_ORDER_ID,
    status: 'pending',
    previousStatus: 'pending',
    notes: 'Order created',
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
  await knex('orderPaymentHistory').where({ orderId: TEST_ORDER_ID }).del();
  await knex('orderPaymentHistory').insert({
    orderPaymentHistoryId: '00000000-0000-0000-0000-000000000231',
    orderId: TEST_ORDER_ID,
    paymentStatus: 'pending',
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
  await knex('orderFulfillmentHistory').where({ orderId: TEST_ORDER_ID }).del();
  await knex('orderFulfillmentHistory').insert({
    orderFulfillmentHistoryId: '00000000-0000-0000-0000-000000000232',
    orderId: TEST_ORDER_ID,
    fulfillmentStatus: 'unfulfilled',
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });

  // Order fulfillment + package for order ops tests (packages, tracking)
  const hasOrderFulfillment = await knex.schema.hasTable('orderFulfillment');
  const hasOrderFulfillmentPackage = await knex.schema.hasTable('orderFulfillmentPackage');
  if (hasOrderFulfillment && hasOrderFulfillmentPackage) {
    await knex('orderFulfillmentPackage').where({ orderFulfillmentPackageId: TEST_ORDER_PACKAGE_ID }).del();
    await knex('orderFulfillment').where({ orderFulfillmentId: TEST_ORDER_FULFILLMENT_ID }).del();

    await knex('orderFulfillment').insert({
      orderFulfillmentId: TEST_ORDER_FULFILLMENT_ID,
      orderId: TEST_ORDER_ID,
      fulfillmentNumber: 'FUL-OPS-0001',
      type: 'shipping',
      status: 'pending',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });

    await knex('orderFulfillmentPackage').insert({
      orderFulfillmentPackageId: TEST_ORDER_PACKAGE_ID,
      orderFulfillmentId: TEST_ORDER_FULFILLMENT_ID,
      packageNumber: 'PKG-OPS-0001',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }

  // Dedicated workflow orders: completed+paid for refund tests, shipped for cancel-guard tests
  const workflowOrders = [
    {
      orderId: TEST_REFUND_ORDER_ID,
      orderNumber: 'TEST-ORDER-REFUND',
      status: 'completed',
      paymentStatus: 'paid',
    },
    {
      orderId: TEST_SHIPPED_ORDER_ID,
      orderNumber: 'TEST-ORDER-SHIPPED',
      status: 'shipped',
      paymentStatus: 'paid',
    },
    {
      orderId: TEST_DELIVERED_ORDER_ID,
      orderNumber: 'TEST-ORDER-DELIVERED',
      status: 'delivered',
      paymentStatus: 'paid',
    },
  ];

  for (const wf of workflowOrders) {
    await knex('orderItem').where({ orderId: wf.orderId }).del();
    await knex('order').where({ orderId: wf.orderId }).del();
    await knex('order').insert({
      orderId: wf.orderId,
      orderNumber: wf.orderNumber,
      customerId: testCustomer.customerId,
      status: wf.status,
      paymentStatus: wf.paymentStatus,
      fulfillmentStatus: 'unfulfilled',
      currencyCode: 'USD',
      subtotalCents: 4999,
      discountTotalCents: 0,
      taxTotalCents: 0,
      shippingTotalCents: 0,
      handlingFeeCents: 0,
      totalAmountCents: 4999,
      totalItems: 1,
      totalQuantity: 1,
      taxExempt: false,
      orderDate: knex.fn.now(),
      customerEmail: 'customer@example.com',
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
      }),
      billingAddress: JSON.stringify({
        firstName: 'Test',
        lastName: 'Customer',
        address1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
      }),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
    await knex('orderItem').insert({
      orderId: wf.orderId,
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      quantity: 1,
      unitPriceCents: 4999,
      discountedUnitPriceCents: 4999,
      lineTotalCents: 4999,
      discountTotalCents: 0,
      taxTotalCents: 0,
      fulfillmentStatus: 'unfulfilled',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }

  // Captured payment on the refund order for /orders/:id/refunds tests
  const hasOrderPayment = await knex.schema.hasTable('orderPayment');
  if (hasOrderPayment) {
    await knex('orderPayment').where({ orderPaymentId: TEST_REFUND_ORDER_PAYMENT_ID }).del();
    await knex('orderPayment').insert({
      orderPaymentId: TEST_REFUND_ORDER_PAYMENT_ID,
      orderId: TEST_REFUND_ORDER_ID,
      type: 'creditCard',
      provider: 'test-gateway',
      amountCents: 4999,
      currencyCode: 'USD',
      status: 'captured',
      refundedAmountCents: 0,
      capturedAt: knex.fn.now(),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }
};
