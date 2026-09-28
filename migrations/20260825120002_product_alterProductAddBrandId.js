/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.uuid('brandId').references('brandId').inTable('brand').onDelete('SET NULL');
    t.index('brandId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('product', t => {
    t.dropIndex('brandId');
    t.dropColumn('brandId');
  });
};
