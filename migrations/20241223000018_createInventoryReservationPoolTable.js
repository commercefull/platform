/**
 * Migration: Create Inventory Reservation (Pool) Table
 * Note: This is the pool-based inventory reservation, separate from the existing stockReservation table
 */

exports.up = async function (knex) {
  // Check if table already exists (from 20241223000005 or 20241223100003)
  const hasTable = await knex.schema.hasTable('inventoryReservation');
  if (hasTable) return;

  await knex.schema.createTable('inventoryReservation', table => {
    table.uuid('inventoryReservationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('inventoryItemId').notNullable();
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('sku');
    table.string('orderId');
    table.string('basketId');
    table.string('locationId');
    table.integer('quantity').notNullable();
    table.string('status').defaultTo('active'); // active, released, fulfilled, expired
    table.timestamp('expiresAt');
    table.string('releasedReason');
    table.timestamp('releasedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['orderId']);
    table.index(['basketId']);
    table.index(['status']);
    table.index(['expiresAt']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventoryReservation');
};
