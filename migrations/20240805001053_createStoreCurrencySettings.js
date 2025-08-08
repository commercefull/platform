/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('storeCurrencySettings', t => {
    t.uuid('storeCurrencySettingsId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('storeCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.uuid('baseCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.uuid('displayCurrencyId').notNullable().references('currencyId').inTable('currency');
    t.boolean('allowCustomerCurrencySelection').notNullable().defaultTo(true);
    t.boolean('showCurrencySelector').notNullable().defaultTo(true);
    t.boolean('autoUpdateRates').notNullable().defaultTo(false);
    t.integer('rateUpdateFrequency').defaultTo(1440);
    t.string('activeProviderCode', 50).references('code').inTable('currencyProvider');
    t.decimal('markupPercentage', 5, 2).notNullable().defaultTo(0);
    t.integer('roundPrecision').notNullable().defaultTo(2);
    t.enu('roundingMethod', ['up', 'down', 'ceiling', 'floor', 'half_up', 'half_down', 'half_even'], { useNative: true, enumName: 'rounding_method_enum' }).notNullable().defaultTo('half_up');
    t.specificType('enabledCurrencies', 'text[]');
    t.enu('priceDisplayFormat', ['symbol', 'code', 'symbol_code', 'name'], { useNative: true, enumName: 'price_display_format_enum' }).notNullable().defaultTo('symbol');
    t.uuid('updatedBy');
    t.index('storeCurrencyId');
    t.index('baseCurrencyId');
    t.index('displayCurrencyId');
    t.index('activeProviderCode');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('storeCurrencySettings');
};
