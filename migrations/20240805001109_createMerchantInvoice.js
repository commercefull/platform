/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantInvoice', t => {
    t.uuid('merchantInvoiceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('invoiceNumber', 50).notNullable().unique();
    t.uuid('payoutId').references('merchantPayoutId').inTable('merchantPayout');
    t.decimal('amount', 15, 2).notNullable();
    t.decimal('tax', 15, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.enum('status', ['draft', 'issued', 'paid', 'cancelled', 'void']).notNullable().defaultTo('draft');
    t.timestamp('invoiceDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('dueDate');
    t.timestamp('paidDate');
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.text('notes');
    
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('merchantId');
    t.index('payoutId');
    t.index('amount');
    t.index('total');
    t.index('status');
    t.index('invoiceDate');
    t.index('dueDate');
    t.index('paidDate');
    t.index('startDate');
    t.index('endDate');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantInvoice');
};
