/**
 * Migration: Create Warehouse Receiving Table
 * General warehouse receiving records (not tied to supplier POs)
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('warehouseReceiving');
  if (hasTable) return;

  await knex.schema.createTable('warehouseReceiving', t => {
    t.uuid('warehouseReceivingId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('distributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse').onDelete('CASCADE');
    t.string('receiptNumber', 50).notNullable().unique();
    t.string('sourceType').notNullable(); // purchase_order, transfer, return, adjustment
    t.string('sourceId');
    t.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).notNullable().defaultTo('pending');
    t.timestamp('expectedDate');
    t.timestamp('receivedDate');
    t.string('carrierName');
    t.string('trackingNumber');
    t.integer('packageCount');
    t.text('notes');
    t.boolean('hasDiscrepancies').notNullable().defaultTo(false);
    t.jsonb('items'); // array of { productId, variantId, sku, name, expectedQty, receivedQty, binId }
    t.timestamp('completedAt');
    t.string('receivedBy');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('distributionWarehouseId');
    t.index('receiptNumber');
    t.index('status');
    t.index('sourceType');
    t.index('sourceId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('warehouseReceiving');
};
