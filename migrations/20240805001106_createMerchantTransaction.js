/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantTransaction', t => {
    t.uuid('merchantTransactionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.enum('transactionType', ['sale', 'refund', 'chargeback', 'commission', 'adjustment', 'payout', 'fee']).notNullable();
    t.decimal('amount', 15, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.uuid('referenceId');
    t.string('referenceType', 50);
    t.text('description');
    t.enum('status', ['pending', 'completed', 'failed', 'cancelled']).notNullable().defaultTo('completed');
    t.decimal('availableBalanceBefore', 15, 2);
    t.decimal('availableBalanceAfter', 15, 2);
    t.decimal('pendingBalanceBefore', 15, 2);
    t.decimal('pendingBalanceAfter', 15, 2);
    t.decimal('reserveBalanceBefore', 15, 2);
    t.decimal('reserveBalanceAfter', 15, 2);
    
    t.text('notes');
    t.uuid('createdBy');
    t.index('merchantId');
    t.index('transactionType');
    t.index('amount');
    t.index('currency');
    t.index('referenceId');
    t.index('referenceType');
    t.index('status');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantTransaction');
};
