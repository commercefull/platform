/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bCompanyCreditLimit', function (table) {
    table.uuid('b2bCompanyCreditLimitId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').notNullable().references('b2bCompanyId').inTable('b2bCompany').onDelete('CASCADE');
    table.decimal('creditLimit', 15, 2).notNullable();
    table.decimal('availableCredit', 15, 2).notNullable();
    table.decimal('usedCredit', 15, 2).defaultTo(0);
    table.decimal('pendingCredit', 15, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('USD');
    table.string('status').defaultTo('active').checkIn(['active', 'suspended', 'exceeded', 'closed']);
    table.integer('paymentTermsDays').defaultTo(30);
    table.decimal('interestRate', 5, 2).defaultTo(0);
    table.decimal('latePaymentFee', 15, 2).defaultTo(0);
    table.date('reviewDate');
    table.date('lastReviewDate');
    table.uuid('reviewedBy');
    table.text('reviewNotes');
    table.decimal('previousLimit', 15, 2);
    table.string('limitChangeReason');
    table.boolean('autoApproveOrders').defaultTo(false);
    table.decimal('autoApproveLimit', 15, 2);
    table.boolean('notifyOnLowCredit').defaultTo(true);
    table.decimal('lowCreditThreshold', 5, 2).defaultTo(20);
    table.boolean('notifyOnExceeded').defaultTo(true);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique('b2bCompanyId');
    table.index('status');
    table.index('reviewDate');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bCompanyCreditLimit');
};
