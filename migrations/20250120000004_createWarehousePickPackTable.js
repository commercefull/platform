/**
 * Migration: Create Warehouse Pick Pack Table
 * Tracks pick/pack operations within a warehouse
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('warehousePickPack');
  if (hasTable) return;

  await knex.schema.createTable('warehousePickPack', t => {
    t.uuid('warehousePickPackId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('distributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse').onDelete('CASCADE');
    t.string('pickPackNumber', 50).notNullable().unique();
    t.string('orderId');
    t.string('fulfillmentId');
    t.enum('status', ['pending', 'picking', 'picked', 'packing', 'packed', 'completed', 'cancelled']).notNullable().defaultTo('pending');
    t.jsonb('items'); // array of { productId, variantId, sku, name, quantity, binId, pickedQty }
    t.string('assignedTo');
    t.timestamp('pickingStartedAt');
    t.timestamp('pickingCompletedAt');
    t.timestamp('packingStartedAt');
    t.timestamp('packingCompletedAt');
    t.text('notes');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('distributionWarehouseId');
    t.index('pickPackNumber');
    t.index('orderId');
    t.index('fulfillmentId');
    t.index('status');
    t.index('assignedTo');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('warehousePickPack');
};
