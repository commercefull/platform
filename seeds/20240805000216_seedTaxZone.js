/**
 * Seed tax zones
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('taxZone').del();
  await knex('taxZone').insert([
    { name: 'US', code: 'us', description: 'All United States', isDefault: true, countries: JSON.stringify(['US']), isActive: true },
    { name: 'EU', code: 'eu', description: 'European Union Countries', isDefault: false, countries: JSON.stringify(['DE','FR','IT','ES','NL','BE','AT','GR','PT','FI','IE','LU','MT','CY']), isActive: true },
    { name: 'UK', code: 'uk', description: 'United Kingdom', isDefault: false, countries: JSON.stringify(['GB']), isActive: true },
    { name: 'CA', code: 'ca', description: 'Canada', isDefault: false, countries: JSON.stringify(['CA']), isActive: true }
  ]);
};
