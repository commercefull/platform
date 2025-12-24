/**
 * Migration: Create Inventory Pool Location Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('inventoryPoolLocation');
  if (hasTable) return;

  await knex.schema.createTable('inventoryPoolLocation', table => {
    table.uuid('inventoryPoolLocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('inventoryPoolId').notNullable().references('inventoryPoolId').inTable('inventoryPool').onDelete('CASCADE');
    table.string('locationType').notNullable(); // warehouse, store
    table.string('locationId').notNullable();
    table.integer('priority').defaultTo(0);
    table.decimal('allocationPercentage', 5, 2); // For even_split strategy
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.unique(['inventoryPoolId', 'locationId']);
    table.index(['locationId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventoryPoolLocation');
};
