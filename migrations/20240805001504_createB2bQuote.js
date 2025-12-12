/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('b2bQuote', function(table) {
    table.uuid('b2bQuoteId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('quoteNumber').unique();
    table.uuid('b2bCompanyId').references('b2bCompanyId').inTable('b2bCompany').onDelete('SET NULL');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.uuid('b2bCompanyUserId').references('b2bCompanyUserId').inTable('b2bCompanyUser').onDelete('SET NULL');
    table.uuid('salesRepId');
    table.string('status').defaultTo('draft').checkIn(['draft', 'pending_review', 'pending_approval', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired', 'converted', 'cancelled']);
    table.string('currency', 3).defaultTo('USD');
    table.decimal('subtotal', 15, 2).defaultTo(0);
    table.decimal('discountTotal', 15, 2).defaultTo(0);
    table.string('discountType').checkIn(['percentage', 'fixed']);
    table.decimal('discountValue', 15, 2);
    table.string('discountReason');
    table.decimal('taxTotal', 15, 2).defaultTo(0);
    table.decimal('shippingTotal', 15, 2).defaultTo(0);
    table.decimal('handlingTotal', 15, 2).defaultTo(0);
    table.decimal('grandTotal', 15, 2).defaultTo(0);
    table.decimal('margin', 15, 2);
    table.decimal('marginPercent', 5, 2);
    table.date('validUntil');
    table.integer('validityDays').defaultTo(30);
    table.uuid('billingAddressId').references('b2bCompanyAddressId').inTable('b2bCompanyAddress').onDelete('SET NULL');
    table.uuid('shippingAddressId').references('b2bCompanyAddressId').inTable('b2bCompanyAddress').onDelete('SET NULL');
    table.string('shippingMethod');
    table.text('customerNotes');
    table.text('internalNotes');
    table.text('terms');
    table.text('conditions');
    table.string('paymentTerms');
    table.integer('paymentTermsDays');
    table.uuid('convertedOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.string('rejectionReason');
    table.integer('revisionNumber').defaultTo(1);
    table.uuid('previousVersionId').references('b2bQuoteId').inTable('b2bQuote').onDelete('SET NULL');
    table.jsonb('attachments').defaultTo('[]');
    table.jsonb('metadata');
    table.timestamp('sentAt');
    table.timestamp('viewedAt');
    table.timestamp('acceptedAt');
    table.timestamp('rejectedAt');
    table.timestamp('convertedAt');
    table.timestamp('expiresAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('quoteNumber');
    table.index('b2bCompanyId');
    table.index('customerId');
    table.index('status');
    table.index('salesRepId');
    table.index('validUntil');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('b2bQuote');
};
