/**
 * Migration: Create Shipping Label Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('shippingLabel');
  if (hasTable) return;

  await knex.schema.createTable('shippingLabel', table => {
    table.uuid('shippingLabelId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('shippingCarrierId').notNullable();
    table.string('carrierName');
    table.string('carrierService');
    table.string('trackingNumber').notNullable();
    table.string('labelUrl');
    table.string('labelFormat').defaultTo('PDF');
    table.string('status').defaultTo('created'); // created, voided, error
    table.string('orderId');
    table.string('fulfillmentId');
    table.string('shipFromName');
    table.string('shipToName');
    table.string('shipToAddressLine1');
    table.string('shipToCity');
    table.string('shipToState');
    table.string('shipToPostalCode');
    table.string('shipToCountry');
    table.decimal('weight', 10, 2);
    table.jsonb('dimensions');
    table.decimal('shippingCost', 10, 2);
    table.string('voidReason');
    table.timestamp('voidedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['orderId']);
    table.index(['fulfillmentId']);
    table.index(['trackingNumber']);
    table.index(['status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('shippingLabel');
};
