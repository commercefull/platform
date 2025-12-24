/**
 * Migration: Add Organization Fields to Price List Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasOrgId = await knex.schema.hasColumn('priceList', 'organizationId');
  if (!hasOrgId) {
    await knex.schema.alterTable('priceList', table => {
      table.uuid('organizationId').nullable();
    });
  }

  const hasType = await knex.schema.hasColumn('priceList', 'type');
  if (!hasType) {
    await knex.schema.alterTable('priceList', table => {
      table.string('type', 20).defaultTo('retail'); // 'retail', 'wholesale', 'contract', 'promo'
    });
  }
};

exports.down = async function (knex) {
  const hasOrgId = await knex.schema.hasColumn('priceList', 'organizationId');
  if (!hasOrgId) return;

  await knex.schema.alterTable('priceList', table => {
    table.dropColumn('organizationId');
    table.dropColumn('type');
  });
};
