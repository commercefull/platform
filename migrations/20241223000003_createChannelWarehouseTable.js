/**
 * Migration: Create Channel Warehouse Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('channelWarehouse');
  if (hasTable) return;

  await knex.schema.createTable('channelWarehouse', table => {
    table.uuid('channelWarehouseId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('channelId').notNullable().references('channelId').inTable('channel').onDelete('CASCADE');
    table.uuid('warehouseId').notNullable();
    table.integer('priority').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.unique(['channelId', 'warehouseId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('channelWarehouse');
};
