/**
 * VAT OSS Report Table
 * Tracks quarterly VAT OSS (One-Stop Shop) reports for EU cross-border sales
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('vatOssReport', t => {
    t.uuid('vatOssReportId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    // Report period
    t.integer('year').notNullable();
    t.integer('quarter').notNullable(); // 1-4
    // Country where merchant is registered for OSS
    t.string('reportingCountry', 2).notNullable();
    // Totals
    t.decimal('totalSales', 15, 2).notNullable().defaultTo(0);
    t.decimal('totalVat', 15, 2).notNullable().defaultTo(0);
    t.integer('transactionCount').notNullable().defaultTo(0);
    // Report status
    t.enum('status', [
      'draft', // Being prepared
      'ready', // Ready for submission
      'submitted', // Submitted to tax authority
      'accepted', // Accepted by tax authority
      'rejected', // Rejected by tax authority
      'amended', // Amendment submitted
      'paid', // VAT paid
    ])
      .notNullable()
      .defaultTo('draft');
    // Submission details
    t.string('submissionReference', 100);
    t.timestamp('submittedAt');
    t.timestamp('acceptedAt');
    t.text('rejectionReason');
    // Payment tracking
    t.decimal('vatPaid', 15, 2);
    t.timestamp('paidAt');
    t.string('paymentReference', 100);
    // Due dates
    t.date('reportingDeadline'); // Last day of month following quarter
    t.date('paymentDeadline');
    // Audit
    t.uuid('generatedBy');
    t.uuid('submittedBy');
    t.jsonb('metadata');

    t.index('merchantId');
    t.index(['year', 'quarter']);
    t.index('status');
    t.index('reportingDeadline');
    t.unique(['merchantId', 'year', 'quarter', 'reportingCountry']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('vatOssReport');
};
