/**
 * Migration: Create Fulfillment Location Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillmentLocation');
  if (hasTable) return;

  await knex.schema.createTable('fulfillmentLocation', table => {
    table.uuid('fulfillmentLocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('organizationId', 50).notNullable();
    table.string('type', 30).notNullable(); // 'warehouse', 'store', 'dropship_vendor', '3pl', 'dark_store'
    table.string('name', 255).notNullable();
    table.string('code', 50).unique().nullable();
    table.string('addressId', 50).nullable();
    table.string('timezone', 50).defaultTo('UTC');
    table.string('sellerId', 50).nullable(); // For dropship vendors
    table.boolean('isActive').defaultTo(true);
    table.jsonb('capabilities').defaultTo('{}'); // { canShip: true, canPickup: true, canLocalDeliver: true }
    table.jsonb('operatingHours').defaultTo('{}');
    table.decimal('latitude', 10, 7).nullable();
    table.decimal('longitude', 10, 7).nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('organizationId');
    table.index('type');
    table.index('sellerId');
    table.index('isActive');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentLocation');
};
