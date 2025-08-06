/**
 * Seed currencies
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('currency').del();
  await knex('currency').insert([
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: true },
    { code: 'EUR', name: 'Euro', symbol: '\u20ac', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'GBP', name: 'British Pound', symbol: '\u00a3', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5', decimalPlaces: 0, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00a5', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimalPlaces: 2, symbolPosition: 'before', isActive: true, isDefault: false }
  ]);
};
