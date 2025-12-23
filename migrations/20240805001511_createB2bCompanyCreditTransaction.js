/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bCompanyCreditTransaction', function (table) {
    table.uuid('b2bCompanyCreditTransactionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').notNullable().references('b2bCompanyId').inTable('b2bCompany').onDelete('CASCADE');
    table
      .uuid('b2bCompanyCreditLimitId')
      .notNullable()
      .references('b2bCompanyCreditLimitId')
      .inTable('b2bCompanyCreditLimit')
      .onDelete('CASCADE');
    table.string('transactionType').notNullable().checkIn(['charge', 'payment', 'refund', 'adjustment', 'write_off', 'fee', 'interest']);
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.decimal('balanceBefore', 15, 2).notNullable();
    table.decimal('balanceAfter', 15, 2).notNullable();
    table.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.uuid('invoiceId');
    table.uuid('paymentId');
    table.string('reference');
    table.text('description');
    table.text('notes');
    table.date('dueDate');
    table.boolean('isPaid').defaultTo(false);
    table.timestamp('paidAt');
    table.string('paymentMethod');
    table.string('paymentReference');
    table.uuid('createdBy');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('b2bCompanyId');
    table.index('b2bCompanyCreditLimitId');
    table.index('transactionType');
    table.index('orderId');
    table.index('dueDate');
    table.index('isPaid');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bCompanyCreditTransaction');
};
