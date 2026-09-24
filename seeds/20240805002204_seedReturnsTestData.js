/**
 * Returns Test Data Seed
 * Seeds order returns for returnsOps integration tests:
 * - A "requested" storeCredit return exercised through the full workflow
 *   (approve -> in-transit -> received -> inspect -> complete)
 * - A second "requested" refund return used for the invalid-transition check
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const TEST_ORDER_ID = '00000000-0000-0000-0000-000000000200';
const TEST_ORDER_ITEM_ID = '00000000-0000-0000-0000-000000000010';
const TEST_ORDER_ITEM_2_ID = '00000000-0000-0000-0000-000000000011';

const RETURN_IDS = {
  WORKFLOW: '0193c000-0000-7000-8000-000000000001',
  INVALID_TRANSITION: '0193c000-0000-7000-8000-000000000002',
};

const RETURN_ITEM_IDS = {
  WORKFLOW: '0193c001-0000-7000-8000-000000000001',
  INVALID_TRANSITION: '0193c001-0000-7000-8000-000000000002',
};

exports.seed = async function (knex) {
  const hasOrderReturn = await knex.schema.hasTable('orderReturn');
  const hasOrderReturnItem = await knex.schema.hasTable('orderReturnItem');
  if (!hasOrderReturn || !hasOrderReturnItem) {
    return;
  }

  const testCustomer = await knex('customer').where({ email: 'customer@example.com' }).first('customerId');
  if (!testCustomer) {
    return;
  }
  const customerId = testCustomer.customerId;

  const now = new Date();

  await knex('orderReturnItem').whereIn('orderReturnItemId', Object.values(RETURN_ITEM_IDS)).del();
  await knex('orderReturn').whereIn('orderReturnId', Object.values(RETURN_IDS)).del();

  // Seed a store credit balance so the debit test has funds to draw on
  const hasLedger = await knex.schema.hasTable('storeCreditLedger');
  if (hasLedger) {
    await knex('storeCreditLedger')
      .where({ referenceType: 'seed', referenceId: '0193c002-0000-7000-8000-000000000001' })
      .del();
    await knex('storeCreditLedger').insert({
      customerId,
      entryType: 'credit',
      referenceType: 'seed',
      referenceId: '0193c002-0000-7000-8000-000000000001',
      amountCents: 10000,
      balanceAfterCents: 10000,
      currencyCode: 'USD',
      reason: 'Seeded store credit',
      createdAt: now,
      updatedAt: now,
    });
  }

  await knex('orderReturn').insert([
    {
      orderReturnId: RETURN_IDS.WORKFLOW,
      orderId: TEST_ORDER_ID,
      returnNumber: 'RMA-OPS-0001',
      customerId,
      status: 'requested',
      returnType: 'storeCredit',
      requestedAt: now,
      returnShippingPaid: false,
      returnCarrier: 'ups',
      returnReason: 'Product arrived damaged',
      requiresInspection: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      orderReturnId: RETURN_IDS.INVALID_TRANSITION,
      orderId: TEST_ORDER_ID,
      returnNumber: 'RMA-OPS-0002',
      customerId,
      status: 'requested',
      returnType: 'refund',
      requestedAt: now,
      returnShippingPaid: false,
      returnCarrier: 'ups',
      returnReason: 'Changed mind',
      requiresInspection: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await knex('orderReturnItem').insert([
    {
      orderReturnItemId: RETURN_ITEM_IDS.WORKFLOW,
      orderReturnId: RETURN_IDS.WORKFLOW,
      orderItemId: TEST_ORDER_ITEM_ID,
      quantity: 1,
      returnReason: 'damaged',
      condition: 'damaged',
      restockItem: false,
      refundAmountCents: 2500,
      createdAt: now,
    },
    {
      orderReturnItemId: RETURN_ITEM_IDS.INVALID_TRANSITION,
      orderReturnId: RETURN_IDS.INVALID_TRANSITION,
      orderItemId: TEST_ORDER_ITEM_2_ID,
      quantity: 1,
      returnReason: 'other',
      condition: 'new',
      restockItem: false,
      refundAmountCents: 1999,
      createdAt: now,
    },
  ]);
};
