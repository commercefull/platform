/**
 * Migration: Add Marketplace Fields to B2B Company Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasOrgId = await knex.schema.hasColumn('b2bCompany', 'organizationId');
  if (!hasOrgId) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.uuid('organizationId').nullable();
    });
  }

  const hasPaymentTermsId = await knex.schema.hasColumn('b2bCompany', 'paymentTermsId');
  if (!hasPaymentTermsId) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.uuid('paymentTermsId').nullable();
    });
  }

  const hasCreditLimit = await knex.schema.hasColumn('b2bCompany', 'creditLimit');
  if (!hasCreditLimit) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.decimal('creditLimit', 15, 2).nullable();
    });
  }

  const hasAvailableCredit = await knex.schema.hasColumn('b2bCompany', 'availableCredit');
  if (!hasAvailableCredit) {
    await knex.schema.alterTable('b2bCompany', table => {
      table.decimal('availableCredit', 15, 2).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasOrgId = await knex.schema.hasColumn('b2bCompany', 'organizationId');
  if (!hasOrgId) return;

  await knex.schema.alterTable('b2bCompany', table => {
    table.dropColumn('organizationId');
    table.dropColumn('paymentTermsId');
    table.dropColumn('creditLimit');
    table.dropColumn('availableCredit');
  });
};
