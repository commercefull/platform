/**
 * Migration: Create Store Delivery Zone Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeDeliveryZone');
  if (hasTable) return;

  await knex.schema.createTable('storeDeliveryZone', table => {
    table.uuid('storeDeliveryZoneId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('storeId').notNullable();
    table.string('name').notNullable();
    table.string('type').notNullable(); // radius, polygon, postal_codes
    table.decimal('radiusKm', 10, 2);
    table.jsonb('polygon'); // GeoJSON polygon
    table.jsonb('postalCodes'); // Array of postal codes
    table.decimal('deliveryFee', 12, 2).defaultTo(0);
    table.decimal('minOrderValue', 12, 2);
    table.integer('estimatedMinutes');
    table.jsonb('deliveryHours');
    table.boolean('isActive').defaultTo(true);
    table.integer('priority').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['storeId']);
    table.index(['isActive']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeDeliveryZone');
};
