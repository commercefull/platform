/**
 * Migration: Add Organization Fields to Store Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasOrgId = await knex.schema.hasColumn('store', 'organizationId');
  if (!hasOrgId) {
    await knex.schema.alterTable('store', table => {
      table.string('organizationId', 50).nullable();
    });
  }

  const hasTaxZoneId = await knex.schema.hasColumn('store', 'taxZoneId');
  if (!hasTaxZoneId) {
    await knex.schema.alterTable('store', table => {
      table.string('taxZoneId', 50).nullable();
    });
  }

  const hasPriceRoundingRules = await knex.schema.hasColumn('store', 'priceRoundingRules');
  if (!hasPriceRoundingRules) {
    await knex.schema.alterTable('store', table => {
      table.jsonb('priceRoundingRules').defaultTo('{}');
    });
  }

  const hasDefaultCurrency = await knex.schema.hasColumn('store', 'defaultCurrency');
  if (!hasDefaultCurrency) {
    await knex.schema.alterTable('store', table => {
      table.string('defaultCurrency', 3).defaultTo('USD');
    });
  }

  const hasDefaultLanguage = await knex.schema.hasColumn('store', 'defaultLanguage');
  if (!hasDefaultLanguage) {
    await knex.schema.alterTable('store', table => {
      table.string('defaultLanguage', 10).defaultTo('en');
    });
  }

  // Update existing stores to reference default organization
  const defaultOrg = await knex('organization').where('slug', 'default').first();
  if (defaultOrg) {
    await knex('store').whereNull('organizationId').update({ organizationId: defaultOrg.organizationId });
  }
};

exports.down = async function (knex) {
  const hasOrgId = await knex.schema.hasColumn('store', 'organizationId');
  if (!hasOrgId) return;

  await knex.schema.alterTable('store', table => {
    table.dropColumn('organizationId');
    table.dropColumn('taxZoneId');
    table.dropColumn('priceRoundingRules');
    table.dropColumn('defaultCurrency');
    table.dropColumn('defaultLanguage');
  });
};
