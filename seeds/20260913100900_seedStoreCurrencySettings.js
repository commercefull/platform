/**
 * Store currency backfill — runs after all store seeds.
 *
 * Every store sells in at least one currency. For each store this seed:
 *   1. Ensures a `storeCurrency` membership exists (defaults to USD).
 *   2. Ensures a `storeCurrencySettings` row exists, with base/display
 *      currency derived from the store's default currency.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const stores = await knex('store').select('storeId');
  const usd = await knex('currency').where({ code: 'USD' }).first('currencyId');

  for (const store of stores) {
    // 1. Ensure at least one supported currency (USD fallback)
    const membership = await knex('storeCurrency').where({ storeId: store.storeId }).first('storeCurrencyId');
    if (!membership && usd) {
      await knex('storeCurrency').insert({
        storeId: store.storeId,
        currencyId: usd.currencyId,
        isDefault: true,
        isActive: true,
      });
    }

    // 2. Ensure per-store currency settings exist
    const settings = await knex('storeCurrencySettings').where({ storeId: store.storeId }).first('storeCurrencySettingsId');
    if (!settings) {
      const defaultMembership = await knex('storeCurrency')
        .where({ storeId: store.storeId, isDefault: true })
        .first('currencyId');
      if (defaultMembership) {
        await knex('storeCurrencySettings').insert({
          storeId: store.storeId,
          baseCurrencyId: defaultMembership.currencyId,
          displayCurrencyId: defaultMembership.currencyId,
          allowCustomerCurrencySelection: true,
          showCurrencySelector: true,
          autoUpdateRates: false,
          rateUpdateFrequency: 1440,
          activeProviderCode: 'manual',
          markupPercentage: 0,
          roundPrecision: 2,
          roundingMethod: 'half_up',
          priceDisplayFormat: 'symbol',
        });
      }
    }
  }
};
