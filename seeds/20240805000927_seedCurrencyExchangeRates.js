/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    WITH "currencyIds" AS (
      SELECT "currencyId", code FROM currency WHERE code IN ('USD', 'EUR', 'GBP', 'CAD')
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
      usd."currencyId", 
      eur."currencyId", 
      0.9200000000, 
      1.0869565217, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      "currencyIds" usd, 
      "currencyIds" eur
    WHERE 
      usd.code = 'USD' AND 
      eur.code = 'EUR'
    
    UNION ALL
    
    SELECT 
      usd."currencyId", 
      gbp."currencyId", 
      0.7800000000, 
      1.2820512821, 
      'manual', 
      CURRENT_TIMESTAMP
    FROM 
      "currencyIds" usd, 
      "currencyIds" gbp
    WHERE 
      usd.code = 'USD' AND 
      gbp.code = 'GBP'

    UNION ALL

    SELECT
      usd."currencyId",
      cad."currencyId",
      1.3500000000,
      0.7407407407,
      'manual',
      CURRENT_TIMESTAMP
    FROM
      "currencyIds" usd,
      "currencyIds" cad
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
    const currencies = await knex('currency').whereIn('code', ['USD', 'EUR', 'GBP', 'CAD']).select('currencyId', 'code');
    const currencyMap = currencies.reduce((acc, curr) => ({ ...acc, [curr.code]: curr.currencyId }), {});

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

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
