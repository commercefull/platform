/**
 * Seed tax zones
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('tax_zone').del();
  await knex('tax_zone').insert([
    { name: 'US', code: 'us', description: 'All United States', is_default: true, countries: ['US'], is_active: true },
    { name: 'EU', code: 'eu', description: 'European Union Countries', is_default: false, countries: ['DE','FR','IT','ES','NL','BE','AT','GR','PT','FI','IE','LU','MT','CY'], is_active: true },
    { name: 'UK', code: 'uk', description: 'United Kingdom', is_default: false, countries: ['GB'], is_active: true },
    { name: 'CA', code: 'ca', description: 'Canada', is_default: false, countries: ['CA'], is_active: true }
  ]);
};
