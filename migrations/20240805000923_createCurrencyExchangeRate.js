/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('currencyExchangeRate', t => {
    t.uuid('currencyExchangeRateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('sourceCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.uuid('targetCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.decimal('rate', 20, 10).notNullable();
    t.decimal('inverseRate', 20, 10).notNullable();
    t.string('provider', 50).notNullable().defaultTo('manual');
    t.string('providerReference', 255);
    t.timestamp('effectiveFrom').notNullable().defaultTo(knex.fn.now());
    t.timestamp('effectiveTo');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('lastUpdated').notNullable().defaultTo(knex.fn.now());

    t.uuid('updatedBy');
    t.index('sourceCurrencyId');
    t.index('targetCurrencyId');
    t.index('isActive');
    t.index('effectiveFrom');
    t.index('effectiveTo');
    t.index('lastUpdated');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('currencyExchangeRate');
};
