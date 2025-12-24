/**
 * Migration: Create Inventory Allocation Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('inventoryAllocation');
  if (hasTable) return;

  await knex.schema.createTable('inventoryAllocation', table => {
    table.uuid('inventoryAllocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('inventoryPoolId').references('inventoryPoolId').inTable('inventoryPool');
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('orderId');
    table.string('basketId');
    table.string('sourceLocationId').notNullable();
    table.integer('quantity').notNullable();
    table.string('status').defaultTo('reserved'); // reserved, allocated, released, fulfilled
    table.timestamp('expiresAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['inventoryPoolId']);
    table.index(['productId', 'variantId']);
    table.index(['orderId']);
    table.index(['status']);
    table.index(['expiresAt']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventoryAllocation');
};
