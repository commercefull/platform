/**
 * Create store credit ledger table.
 * The existing orderReturn and orderReturnItem tables are reused by the new returns module.
 * This migration adds the storeCreditLedger table for tracking store credit balances and transactions.
 */

exports.up = async function (knex) {
  const hasStoreCreditLedger = await knex.schema.hasTable('storeCreditLedger');
  if (!hasStoreCreditLedger) {
    await knex.schema.createTable('storeCreditLedger', t => {
      t.uuid('storeCreditLedgerId').primary().defaultTo(knex.raw('uuidv7()'));
      t.uuid('customerId').notNullable();
      t.string('entryType').notNullable().checkIn(['credit', 'debit', 'adjustment', 'expiry']);
      t.string('referenceType').nullable();
      t.uuid('referenceId').nullable();
      t.decimal('amount', 15, 2).notNullable();
      t.decimal('balanceAfter', 15, 2).notNullable();
      t.string('currency').notNullable().defaultTo('USD');
      t.text('reason').nullable();
      t.text('notes').nullable();
      t.string('createdBy').nullable();
      t.timestamp('expiresAt').nullable();
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      t.index(['customerId', 'createdAt'], 'idx_storeCredit_customer_created');
      t.index(['referenceType', 'referenceId'], 'idx_storeCredit_reference');
      t.index(['entryType'], 'idx_storeCredit_entryType');
      t.index(['expiresAt'], 'idx_storeCredit_expiry');
    });
  }

  // Add warranty columns to orderReturnItem if they don't exist
  const hasWarrantyClaimId = await knex.schema.hasColumn('orderReturnItem', 'warrantyClaimId');
  if (!hasWarrantyClaimId) {
    await knex.schema.alterTable('orderReturnItem', t => {
      t.string('warrantyClaimId', 100).nullable();
      t.string('warrantyStatus').nullable().checkIn(['none', 'claimed', 'approved', 'denied', 'expired']);
      t.timestamp('warrantyExpiresAt').nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasWarrantyClaimId = await knex.schema.hasColumn('orderReturnItem', 'warrantyClaimId');
  if (hasWarrantyClaimId) {
    await knex.schema.alterTable('orderReturnItem', t => {
      t.dropColumn('warrantyClaimId');
      t.dropColumn('warrantyStatus');
      t.dropColumn('warrantyExpiresAt');
    });
  }

  const hasStoreCreditLedger = await knex.schema.hasTable('storeCreditLedger');
  if (hasStoreCreditLedger) await knex.schema.dropTable('storeCreditLedger');
};
