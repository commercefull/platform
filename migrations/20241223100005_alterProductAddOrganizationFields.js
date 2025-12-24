/**
 * Migration: Add Organization Fields to Product Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasOrgId = await knex.schema.hasColumn('product', 'organizationId');
  if (!hasOrgId) {
    await knex.schema.alterTable('product', table => {
      table.string('organizationId', 50).nullable();
    });
  }

  const hasApprovalStatus = await knex.schema.hasColumn('product', 'approvalStatus');
  if (!hasApprovalStatus) {
    await knex.schema.alterTable('product', table => {
      table.string('approvalStatus', 20).defaultTo('approved');
    });
  }

  const hasPlatformVisible = await knex.schema.hasColumn('product', 'platformVisible');
  if (!hasPlatformVisible) {
    await knex.schema.alterTable('product', table => {
      table.boolean('platformVisible').defaultTo(true);
    });
  }
};

exports.down = async function (knex) {
  const hasOrgId = await knex.schema.hasColumn('product', 'organizationId');
  if (!hasOrgId) return;

  await knex.schema.alterTable('product', table => {
    table.dropColumn('organizationId');
    table.dropColumn('approvalStatus');
    table.dropColumn('platformVisible');
  });
};
