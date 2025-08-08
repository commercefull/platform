/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shippingMethod', t => {
    t.uuid('shippingMethodId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('carrierId').references('shippingCarrierId').inTable('shippingCarrier');
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.string('serviceCode', 50);
    t.enum('domesticInternational', ['domestic', 'international', 'both'], { useNative: true, enumName: 'shipping_method_domestic_international_type' }).notNullable().defaultTo('both');
    t.jsonb('estimatedDeliveryDays');
    t.integer('handlingDays').defaultTo(1);
    t.integer('priority').defaultTo(0);
    t.boolean('displayOnFrontend').notNullable().defaultTo(true);
    t.boolean('allowFreeShipping').notNullable().defaultTo(true);
    t.decimal('minWeight', 10, 2);
    t.decimal('maxWeight', 10, 2);
    t.decimal('minOrderValue', 10, 2);
    t.decimal('maxOrderValue', 10, 2);
    t.jsonb('dimensionRestrictions');
    t.string('shippingClass', 50);
    t.jsonb('customFields');
    
    t.uuid('createdBy');
    t.index('carrierId');
    t.index('code');
    t.index('isActive');
    t.index('isDefault');
    t.index('domesticInternational');
    t.index('displayOnFrontend');
    t.index('priority');
    t.index('shippingClass');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shippingMethod');
};
