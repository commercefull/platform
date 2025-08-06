/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('currencyProvider').insert([
    { name: 'Manual', code: 'manual', description: 'Manually entered exchange rates', apiUrl: null, isActive: true },
    { name: 'Exchange Rates API', code: 'exchangeratesapi', description: 'Exchange Rates API (exchangeratesapi.io)', apiUrl: 'https://api.exchangeratesapi.io', isActive: false },
    { name: 'Open Exchange Rates', code: 'openexchangerates', description: 'Open Exchange Rates (openexchangerates.org)', apiUrl: 'https://openexchangerates.org/api', isActive: false },
    { name: 'Currency Layer', code: 'currencylayer', description: 'Currency Layer (currencylayer.com)', apiUrl: 'https://api.currencylayer.com', isActive: false }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('currencyProvider').whereIn('code', [
    'manual', 'exchangeratesapi', 'openexchangerates', 'currencylayer'
  ]).delete();
};
