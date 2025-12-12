/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('storeLocation', function(table) {
    table.uuid('storeLocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table.string('type').defaultTo('store'); // store, warehouse, pickup_point, locker
    table.text('description');
    table.string('address1').notNullable();
    table.string('address2');
    table.string('city').notNullable();
    table.string('state');
    table.string('postalCode').notNullable();
    table.string('country', 2).notNullable();
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('phone');
    table.string('email');
    table.jsonb('operatingHours'); // { monday: { open: "09:00", close: "18:00" }, ... }
    table.jsonb('holidayHours');
    table.jsonb('specialHours');
    table.string('timezone').defaultTo('UTC');
    table.boolean('isActive').defaultTo(true);
    table.boolean('acceptsPickup').defaultTo(true);
    table.boolean('acceptsReturns').defaultTo(true);
    table.boolean('hasLocker').defaultTo(false);
    table.integer('lockerCount');
    table.integer('pickupCapacityPerHour');
    table.integer('pickupLeadTimeMinutes').defaultTo(60);
    table.integer('maxPickupDays').defaultTo(7);
    table.text('pickupInstructions');
    table.string('imageUrl');
    table.jsonb('amenities'); // parking, wheelchair_accessible, etc.
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('code');
    table.index('isActive');
    table.index(['latitude', 'longitude']);
    table.index('type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('storeLocation');
};
