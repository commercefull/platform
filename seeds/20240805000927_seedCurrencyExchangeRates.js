/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    WITH currency_ids AS (
      SELECT id, code FROM currency WHERE code IN ('USD', 'EUR', 'GBP', 'CAD')
    )
    INSERT INTO "currencyExchangeRate" (
      "sourceCurrencyId", 
      "targetCurrencyId", 
      "rate", 
      "inverseRate", 
      "provider", 
      "effectiveFrom"
    )
    SELECT 
      usd.id, 
      eur.id, 
      0.9200000000, 
      1.0869565217, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids eur
    WHERE 
      usd.code = 'USD' AND 
      eur.code = 'EUR'
    
    UNION ALL
    
    SELECT 
      usd.id, 
      gbp.id, 
      0.7800000000, 
      1.2820512821, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      currency_ids usd, 
      currency_ids gbp
    WHERE 
      usd.code = 'USD' AND 
      gbp.code = 'GBP'

    UNION ALL

    SELECT
      usd.id,
      cad.id,
      1.3500000000,
      0.7407407407,
      'manual',
      CURRENT_TIMESTAMP
    FROM
      currency_ids usd,
      currency_ids cad
    WHERE
      usd.code = 'USD' AND
      cad.code = 'CAD'
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    const currencies = await knex('currency').whereIn('code', ['USD', 'EUR', 'GBP', 'CAD']).select('id', 'code');
    const currencyMap = currencies.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.id }), {});

    if (currencyMap.USD && currencyMap.EUR) {
        await knex('currencyExchangeRate').where({ sourceCurrencyId: currencyMap.USD, targetCurrencyId: currencyMap.EUR }).delete();
    }
    if (currencyMap.USD && currencyMap.GBP) {
        await knex('currencyExchangeRate').where({ sourceCurrencyId: currencyMap.USD, targetCurrencyId: currencyMap.GBP }).delete();
    }
    if (currencyMap.USD && currencyMap.CAD) {
        await knex('currencyExchangeRate').where({ sourceCurrencyId: currencyMap.USD, targetCurrencyId: currencyMap.CAD }).delete();
    }
};
