/**
 * Migration: Create Fulfillment Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillment');
  if (hasTable) return;

  await knex.schema.createTable('fulfillment', table => {
    table.uuid('fulfillmentId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('orderId').notNullable();
    table.string('orderNumber');
    table.string('sourceType').notNullable(); // warehouse, merchant, supplier, dropship, store
    table.string('sourceId').notNullable();
    table.string('merchantId');
    table.string('supplierId');
    table.string('storeId');
    table.string('channelId');
    table.string('status').notNullable().defaultTo('pending');
    table.string('carrierId');
    table.string('carrierName');
    table.string('shippingMethodId');
    table.string('shippingMethodName');
    table.string('trackingNumber');
    table.string('trackingUrl');
    table.jsonb('shipFromAddress').notNullable();
    table.jsonb('shipToAddress').notNullable();
    table.string('fulfillmentPartnerId');
    table.integer('weightGrams');
    table.integer('lengthCm');
    table.integer('widthCm');
    table.integer('heightCm');
    table.decimal('shippingCost', 12, 2);
    table.decimal('insuranceCost', 12, 2);
    table.text('notes');
    table.text('internalNotes');
    table.timestamp('assignedAt');
    table.timestamp('pickingStartedAt');
    table.timestamp('pickedAt');
    table.timestamp('packingStartedAt');
    table.timestamp('packedAt');
    table.timestamp('shippedAt');
    table.timestamp('deliveredAt');
    table.timestamp('cancelledAt');
    table.timestamp('failedAt');
    table.text('failureReason');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['orderId']);
    table.index(['status']);
    table.index(['merchantId']);
    table.index(['storeId']);
    table.index(['trackingNumber']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillment');
};
