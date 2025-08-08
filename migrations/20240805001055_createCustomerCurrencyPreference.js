/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerCurrencyPreference', t => {
    t.uuid('customerCurrencyPreferenceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE').unique();
    t.uuid('currencyId').notNullable().references('currencyId').inTable('currency');
    t.boolean('automaticDetection').notNullable().defaultTo(true);
    t.index('currencyId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerCurrencyPreference');
};
