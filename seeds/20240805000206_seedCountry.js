/**
 * Seed countries
 * @param { import('knex').Knex } knex
 */
exports.seed = async function (knex) {
  await knex('country').del();
  await knex('country').insert([
    { code: 'US', name: 'United States', alpha3Code: 'USA', numericCode: 840, region: 'North America', isActive: true },
    { code: 'CA', name: 'Canada', alpha3Code: 'CAN', numericCode: 124, region: 'North America', isActive: true },
    { code: 'GB', name: 'United Kingdom', alpha3Code: 'GBR', numericCode: 826, region: 'Europe', isActive: true },
    { code: 'DE', name: 'Germany', alpha3Code: 'DEU', numericCode: 276, region: 'Europe', isActive: true },
    { code: 'FR', name: 'France', alpha3Code: 'FRA', numericCode: 250, region: 'Europe', isActive: true },
    { code: 'IT', name: 'Italy', alpha3Code: 'ITA', numericCode: 380, region: 'Europe', isActive: true },
    { code: 'ES', name: 'Spain', alpha3Code: 'ESP', numericCode: 724, region: 'Europe', isActive: true },
    { code: 'JP', name: 'Japan', alpha3Code: 'JPN', numericCode: 392, region: 'Asia', isActive: true },
    { code: 'CN', name: 'China', alpha3Code: 'CHN', numericCode: 156, region: 'Asia', isActive: true },
    { code: 'IN', name: 'India', alpha3Code: 'IND', numericCode: 356, region: 'Asia', isActive: true },
    { code: 'AU', name: 'Australia', alpha3Code: 'AUS', numericCode: 36, region: 'Oceania', isActive: true },
    { code: 'BR', name: 'Brazil', alpha3Code: 'BRA', numericCode: 76, region: 'South America', isActive: true },
    { code: 'MX', name: 'Mexico', alpha3Code: 'MEX', numericCode: 484, region: 'North America', isActive: true },
  ]);
};
