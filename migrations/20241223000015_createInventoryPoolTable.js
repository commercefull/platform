/**
 * Migration: Create Inventory Pool Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('inventoryPool');
  if (hasTable) return;

  await knex.schema.createTable('inventoryPool', table => {
    table.uuid('inventoryPoolId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('ownerType').notNullable(); // business, merchant
    table.string('ownerId').notNullable();
    table.string('poolType').notNullable().defaultTo('shared'); // shared, virtual, aggregated
    table.string('allocationStrategy').defaultTo('fifo'); // fifo, nearest, even_split
    table.string('reservationPolicy').defaultTo('immediate'); // immediate, deferred
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['ownerType', 'ownerId']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventoryPool');
};
