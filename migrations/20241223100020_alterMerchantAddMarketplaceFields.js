/**
 * Migration: Add Marketplace Fields to Merchant Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasType = await knex.schema.hasColumn('merchant', 'type');
  if (!hasType) {
    await knex.schema.alterTable('merchant', table => {
      table.string('type', 20).defaultTo('external'); // 'internal', 'external'
    });
  }

  const hasCommissionPlanId = await knex.schema.hasColumn('merchant', 'commissionPlanId');
  if (!hasCommissionPlanId) {
    await knex.schema.alterTable('merchant', table => {
      table.uuid('commissionPlanId').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasType = await knex.schema.hasColumn('merchant', 'type');
  if (!hasType) return;

  await knex.schema.alterTable('merchant', table => {
    table.dropColumn('type');
    table.dropColumn('commissionPlanId');
  });
};
