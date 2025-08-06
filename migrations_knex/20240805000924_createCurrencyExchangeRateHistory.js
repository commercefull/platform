/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currencyExchangeRateHistory', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('sourceCurrencyId').notNullable().references('id').inTable('currency');
    t.uuid('targetCurrencyId').notNullable().references('id').inTable('currency');
    t.decimal('rate', 20, 10).notNullable();
    t.string('provider', 50).notNullable();
    t.string('providerReference', 255);
    t.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    t.uuid('updatedBy');
    t.index('sourceCurrencyId');
    t.index('targetCurrencyId');
    t.index('timestamp');
    t.index(['sourceCurrencyId', 'targetCurrencyId', 'timestamp']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currencyExchangeRateHistory');
};
