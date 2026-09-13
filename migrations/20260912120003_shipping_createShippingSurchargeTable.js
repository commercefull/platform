/**
 * Creates the `shippingSurcharge` table for carrier surcharges
 * (fuel, remote-area, residential, oversize, signature, insurance).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shippingSurcharge', t => {
    t.uuid('shippingSurchargeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('shippingRateId').notNullable().references('shippingRateId').inTable('shippingRate').onDelete('CASCADE');
    t.enum('type', ['fuel', 'remoteArea', 'residential', 'oversize', 'signature', 'insurance']).notNullable();
    t.enum('calculationType', ['flat', 'percentage']).notNullable().defaultTo('flat');
    t.decimal('value', 15, 2).notNullable();
    t.jsonb('conditions');
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('shippingRateId');
    t.index('type');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shippingSurcharge');
};
