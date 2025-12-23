/**
 * Migration: Create Fulfillment Module Tables
 */

exports.up = async function (knex) {
  // Create fulfillment table
  await knex.schema.createTable('fulfillment', table => {
    table.string('fulfillmentId').primary();
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

  // Create fulfillment_item table
  await knex.schema.createTable('fulfillmentItem', table => {
    table.string('fulfillmentItemId').primary();
    table.string('fulfillmentId').notNullable().references('fulfillmentId').inTable('fulfillment').onDelete('CASCADE');
    table.string('orderItemId').notNullable();
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('sku').notNullable();
    table.string('name').notNullable();
    table.integer('quantityOrdered').notNullable();
    table.integer('quantityFulfilled').defaultTo(0);
    table.integer('quantityPicked');
    table.integer('quantityPacked');
    table.string('warehouseLocation');
    table.string('binLocation');
    table.jsonb('serialNumbers');
    table.jsonb('lotNumbers');
    table.boolean('isPicked').defaultTo(false);
    table.boolean('isPacked').defaultTo(false);
    table.timestamp('pickedAt');
    table.timestamp('packedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['fulfillmentId']);
    table.index(['productId']);
  });

  // Create fulfillment_partner table (3PL partners)
  await knex.schema.createTable('fulfillmentPartner', table => {
    table.string('fulfillmentPartnerId').primary();
    table.string('name').notNullable();
    table.string('code').notNullable().unique();
    table.string('type'); // 3pl, dropship, carrier
    table.jsonb('apiConfig');
    table.jsonb('address');
    table.string('contactEmail');
    table.string('contactPhone');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  // Create fulfillment_rule table
  await knex.schema.createTable('fulfillmentRule', table => {
    table.string('fulfillmentRuleId').primary();
    table.string('name').notNullable();
    table.string('type').notNullable(); // routing, splitting, assignment
    table.jsonb('conditions').notNullable();
    table.jsonb('actions').notNullable();
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['type', 'isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentRule');
  await knex.schema.dropTableIfExists('fulfillmentPartner');
  await knex.schema.dropTableIfExists('fulfillmentItem');
  await knex.schema.dropTableIfExists('fulfillment');
};
