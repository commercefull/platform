/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shippingRate', t => {
    t.uuid('shippingRateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('zoneId').notNullable().references('shippingZoneId').inTable('shippingZone').onDelete('CASCADE');
    t.uuid('methodId').notNullable().references('shippingMethodId').inTable('shippingMethod').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('rateType', ['flat', 'weightBased', 'priceBased', 'itemBased', 'dimensional', 'calculated', 'free'], { useNative: true, enumName: 'shipping_rate_type' }).notNullable();
    t.decimal('baseRate', 10, 2).notNullable();
    t.decimal('perItemRate', 10, 2).defaultTo(0);
    t.decimal('freeThreshold', 10, 2);
    t.jsonb('rateMatrix');
    t.decimal('minRate', 10, 2);
    t.decimal('maxRate', 10, 2);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('taxable').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.timestamp('validFrom');
    t.timestamp('validTo');
    t.jsonb('conditions');
    
    t.uuid('createdBy');
    t.index('zoneId');
    t.index('methodId');
    t.index('isActive');
    t.index('rateType');
    t.index('priority');
    t.index('currency');
    t.index('validFrom');
    t.index('validTo');
    t.unique(['zoneId', 'methodId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shippingRate');
};
