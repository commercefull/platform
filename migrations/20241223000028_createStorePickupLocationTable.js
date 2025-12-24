/**
 * Migration: Create Store Pickup Location Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storePickupLocation');
  if (hasTable) return;

  await knex.schema.createTable('storePickupLocation', table => {
    table.uuid('storePickupLocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('storeId').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('address').notNullable();
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.jsonb('operatingHours');
    table.string('contactPhone');
    table.string('contactEmail');
    table.text('instructions');
    table.boolean('isActive').defaultTo(true);
    table.integer('sortOrder').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['storeId']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storePickupLocation');
};
