/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.uuid('businessId').references('businessId').inTable('business');
    t.uuid('storeId').references('storeId').inTable('store');

    t.index('businessId');
    t.index('storeId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.dropIndex('businessId');
    t.dropIndex('storeId');
    t.dropColumn('businessId');
    t.dropColumn('storeId');
  });
};
