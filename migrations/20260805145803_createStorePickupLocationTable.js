/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storePickupLocation');
  if (hasTable) return;

  await knex.schema.createTable('storePickupLocation', table => {
    table.string('pickupLocationId').primary();
    table.string('storeId').notNullable();
    table.string('name').notNullable();
    table.text('addressLine1').notNullable();
    table.text('addressLine2');
    table.string('city').notNullable();
    table.string('state');
    table.string('postalCode').notNullable();
    table.string('country').notNullable();
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.jsonb('operatingHours');
    table.string('contactPhone');
    table.string('contactEmail');
    table.text('instructions');
    table.integer('maxOrdersPerSlot').defaultTo(10);
    table.integer('prepareTimeMinutes').defaultTo(60);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['storeId']);
    table.index(['isActive']);
    table.index(['latitude', 'longitude']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storePickupLocation');
};
