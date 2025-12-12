/**
 * Distribution Warehouse Migration
 * Creates the distributionWarehouse table for warehouse/fulfillment center management
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionWarehouse', t => {
    t.uuid('distributionWarehouseId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isFulfillmentCenter').notNullable().defaultTo(true);
    t.boolean('isReturnCenter').notNullable().defaultTo(true);
    t.boolean('isVirtual').notNullable().defaultTo(false);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.string('addressLine1', 255).notNullable();
    t.string('addressLine2', 255);
    t.string('city', 100).notNullable();
    t.string('state', 100).notNullable();
    t.string('postalCode', 20).notNullable();
    t.string('country', 2).notNullable();
    t.decimal('latitude', 10, 7);
    t.decimal('longitude', 10, 7);
    t.string('email', 255);
    t.string('phone', 30);
    t.string('contactName', 100);
    t.string('timezone', 50).notNullable().defaultTo('UTC');
    t.time('cutoffTime').defaultTo('14:00:00');
    t.integer('processingTime').defaultTo(1);
    t.jsonb('operatingHours');
    t.jsonb('capabilities');
    t.specificType('shippingMethods', 'text[]');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('isDefault');
    t.index('isFulfillmentCenter');
    t.index('isReturnCenter');
    t.index('merchantId');
    t.index('country');
    t.index(['latitude', 'longitude']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionWarehouse');
};
