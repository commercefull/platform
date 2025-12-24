/**
 * Migration: Add Fields to Inventory Level Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasSafetyStock = await knex.schema.hasColumn('inventoryLevel', 'safetyStockQty');
  if (!hasSafetyStock) {
    await knex.schema.alterTable('inventoryLevel', table => {
      table.integer('safetyStockQty').defaultTo(0);
    });
  }

  const hasInboundQty = await knex.schema.hasColumn('inventoryLevel', 'inboundQty');
  if (!hasInboundQty) {
    await knex.schema.alterTable('inventoryLevel', table => {
      table.integer('inboundQty').defaultTo(0);
    });
  }

  const hasLocationId = await knex.schema.hasColumn('inventoryLevel', 'locationId');
  if (!hasLocationId) {
    await knex.schema.alterTable('inventoryLevel', table => {
      table.string('locationId', 50).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasSafetyStock = await knex.schema.hasColumn('inventoryLevel', 'safetyStockQty');
  if (!hasSafetyStock) return;

  await knex.schema.alterTable('inventoryLevel', table => {
    table.dropColumn('safetyStockQty');
    table.dropColumn('inboundQty');
    table.dropColumn('locationId');
  });
};
