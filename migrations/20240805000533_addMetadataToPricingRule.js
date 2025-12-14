/**
 * Add metadata column to pricingRule table for storing currency-specific data
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('pricingRule', t => {
    t.jsonb('metadata').nullable();
    t.string('currencyCode', 3).nullable();
    t.string('regionCode', 10).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('pricingRule', t => {
    t.dropColumn('metadata');
    t.dropColumn('currencyCode');
    t.dropColumn('regionCode');
  });
};
