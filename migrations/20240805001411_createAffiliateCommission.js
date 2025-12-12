/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('affiliateCommission', function(table) {
    table.uuid('affiliateCommissionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('affiliateId').notNullable().references('affiliateId').inTable('affiliate').onDelete('CASCADE');
    table.uuid('affiliateLinkId').references('affiliateLinkId').inTable('affiliateLink').onDelete('SET NULL');
    table.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.decimal('orderTotal', 15, 2).notNullable();
    table.decimal('commissionableAmount', 15, 2).notNullable();
    table.decimal('commissionRate', 5, 2).notNullable();
    table.string('commissionType').notNullable().checkIn(['percentage', 'fixed']);
    table.decimal('commissionAmount', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('status').defaultTo('pending').checkIn(['pending', 'approved', 'paid', 'rejected', 'refunded']);
    table.boolean('isFirstOrder').defaultTo(false);
    table.text('notes');
    table.text('rejectionReason');
    table.timestamp('approvedAt');
    table.uuid('approvedBy');
    table.uuid('payoutId');
    table.timestamp('paidAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('affiliateId');
    table.index('orderId');
    table.index('status');
    table.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('affiliateCommission');
};
