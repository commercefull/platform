/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const usdCurrency = await knex('currency').where({ code: 'USD' }).first();

  if (usdCurrency) {
    await knex('storeCurrencySettings').insert({
      storeCurrencyId: usdCurrency.id,
      baseCurrencyId: usdCurrency.id,
      displayCurrencyId: usdCurrency.id,
      allowCustomerCurrencySelection: true,
      showCurrencySelector: true,
      autoUpdateRates: false,
      rateUpdateFrequency: 1440,
      activeProviderCode: 'manual',
      markupPercentage: 0,
      roundPrecision: 2,
      roundingMethod: 'half_up',
      enabledCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      priceDisplayFormat: 'symbol',
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('storeCurrencySettings').del();
};
