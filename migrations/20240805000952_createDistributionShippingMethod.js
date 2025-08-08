/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionShippingMethod', t => {
    t.uuid('distributionShippingMethodId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.string('carrier', 50);
    t.string('serviceCode', 50);
    t.uuid('shippingZoneId').references('shippingZoneId').inTable('shippingZone');
    t.decimal('baseRate', 15, 2).notNullable().defaultTo(0);
    t.jsonb('rateCalculation');
    t.boolean('isActive').notNullable().defaultTo(true);
    
    t.index('code');
    t.index('shippingZoneId');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distributionShippingMethod');
};
