/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currencyExchangeRateHistory', t => {
    t.uuid('currencyExchangeRateHistoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('sourceCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.uuid('targetCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.decimal('rate', 20, 10).notNullable();
    t.string('provider', 50).notNullable();
    t.string('providerReference', 255);

    t.uuid('updatedBy');
    t.index('sourceCurrencyId');
    t.index('targetCurrencyId');
    t.index('createdAt');
    t.index(['sourceCurrencyId', 'targetCurrencyId', 'createdAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currencyExchangeRateHistory');
};
