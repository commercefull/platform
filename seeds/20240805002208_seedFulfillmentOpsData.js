/**
 * Fulfillment Ops Test Data Seed
 * Seeds a pending fulfillment, a fulfillment location, and two
 * fulfillment partners for fulfillmentOps integration tests.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';
const TEST_ORDER_ID = '00000000-0000-0000-0000-000000000200';
const TEST_ORDER_ITEM_ID = '00000000-0000-0000-0000-000000000010';
const TEST_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_WAREHOUSE_ID = '0193b000-0000-7000-8000-000000000001';

const FULFILLMENT_ID = '01944000-0000-7000-8000-000000000001';
const LOCATION_ID = '01944001-0000-7000-8000-000000000001';
const PARTNER_UPDATE_ID = '01944002-0000-7000-8000-000000000001';
const PARTNER_DELETE_ID = '01944002-0000-7000-8000-000000000002';

exports.seed = async function (knex) {
  const now = new Date();

  if (await knex.schema.hasTable('fulfillment')) {
    await knex('fulfillment').where('fulfillmentId', FULFILLMENT_ID).del();
    await knex('fulfillment').insert({
      fulfillmentId: FULFILLMENT_ID,
      orderId: TEST_ORDER_ID,
      orderNumber: 'TEST-ORDER-001',
      sourceType: 'store',
      sourceId: '00000000-0000-0000-0000-000000000001',
      organizationId: ORGANIZATION_ID,
      status: 'pending',
      shipFromAddress: JSON.stringify({ line1: '1 Dock St', city: 'Portland', state: 'OR', postalCode: '97035', country: 'US' }),
      shipToAddress: JSON.stringify({ line1: '2 Home Ave', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US' }),
      createdAt: now,
      updatedAt: now,
    });
  }

  if (await knex.schema.hasTable('fulfillmentLocation')) {
    await knex('fulfillmentLocation').where('fulfillmentLocationId', LOCATION_ID).del();
    await knex('fulfillmentLocation').insert({
      fulfillmentLocationId: LOCATION_ID,
      organizationId: ORGANIZATION_ID,
      type: 'warehouse',
      name: 'Ops Delete Location',
      code: 'OPS-DEL-LOC',
      capabilities: JSON.stringify({ canShip: true, canPickup: false, canLocalDeliver: false }),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (await knex.schema.hasTable('fulfillmentPartner')) {
    await knex('fulfillmentPartner').whereIn('fulfillmentPartnerId', [PARTNER_UPDATE_ID, PARTNER_DELETE_ID]).del();
    await knex('fulfillmentPartner').insert([
      {
        fulfillmentPartnerId: PARTNER_UPDATE_ID,
        name: 'Ops Update Partner',
        code: 'OPS-UPD-PARTNER',
        type: '3pl',
        contactEmail: 'partner@test.com',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fulfillmentPartnerId: PARTNER_DELETE_ID,
        name: 'Ops Delete Partner',
        code: 'OPS-DEL-PARTNER',
        type: 'carrier',
        contactEmail: 'delete-me@test.com',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }
};
