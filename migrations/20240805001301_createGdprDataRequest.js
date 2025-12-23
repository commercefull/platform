/**
 * GDPR Data Request Table
 * Tracks customer requests for data export, deletion, rectification per GDPR Articles 15-21
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('gdprDataRequest', t => {
    t.uuid('gdprDataRequestId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    // Request type per GDPR articles
    t.enum('requestType', [
      'export', // Article 20 - Data portability
      'deletion', // Article 17 - Right to erasure
      'rectification', // Article 16 - Right to rectification
      'restriction', // Article 18 - Right to restriction
      'access', // Article 15 - Right of access
      'objection', // Article 21 - Right to object
    ]).notNullable();
    t.enum('status', [
      'pending', // Awaiting processing
      'processing', // Being processed
      'completed', // Successfully completed
      'rejected', // Rejected (with reason)
      'cancelled', // Cancelled by customer
      'failed', // Technical failure
    ])
      .notNullable()
      .defaultTo('pending');
    t.text('reason'); // Customer's reason for request
    t.jsonb('requestedData'); // Specific data categories requested
    // For export requests
    t.string('downloadUrl', 500);
    t.timestamp('downloadExpiresAt');
    t.string('downloadFormat', 20).defaultTo('json'); // json, csv, xml
    // Processing info
    t.timestamp('processedAt');
    t.uuid('processedBy'); // Admin who processed
    t.text('adminNotes');
    t.text('rejectionReason');
    // Verification
    t.boolean('identityVerified').defaultTo(false);
    t.string('verificationMethod', 50); // email, document, in_person
    t.timestamp('verifiedAt');
    // Compliance tracking
    t.timestamp('deadlineAt'); // GDPR requires 30 days
    t.boolean('extensionRequested').defaultTo(false);
    t.text('extensionReason');
    t.timestamp('extendedDeadlineAt');
    // Audit
    t.string('ipAddress', 50);
    t.string('userAgent', 255);

    t.index('customerId');
    t.index('requestType');
    t.index('status');
    t.index('deadlineAt');
    t.index('createdAt');
    t.index(['status', 'deadlineAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('gdprDataRequest');
};
