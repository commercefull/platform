/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('marketingAffiliate', function (table) {
    table.uuid('marketingAffiliateId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('email').notNullable();
    table.string('firstName');
    table.string('lastName');
    table.string('companyName');
    table.string('website');
    table.string('socialMedia');
    table.string('affiliateCode').unique().notNullable();
    table.string('status').defaultTo('pending').checkIn(['pending', 'active', 'suspended', 'rejected', 'closed']);
    table.string('tier').defaultTo('standard').checkIn(['standard', 'silver', 'gold', 'platinum']);
    table.decimal('commissionRate', 5, 2).defaultTo(10);
    table.string('commissionType').defaultTo('percentage').checkIn(['percentage', 'fixed', 'tiered']);
    table.integer('cookieDurationDays').defaultTo(30);
    table.decimal('lifetimeEarnings', 15, 2).defaultTo(0);
    table.decimal('pendingBalance', 15, 2).defaultTo(0);
    table.decimal('availableBalance', 15, 2).defaultTo(0);
    table.decimal('totalPaidOut', 15, 2).defaultTo(0);
    table.integer('totalClicks').defaultTo(0);
    table.integer('totalConversions').defaultTo(0);
    table.decimal('conversionRate', 5, 2).defaultTo(0);
    table.decimal('averageOrderValue', 15, 2).defaultTo(0);
    table.string('paymentMethod').checkIn(['paypal', 'bank_transfer', 'check', 'store_credit']);
    table.string('paypalEmail');
    table.jsonb('bankDetails');
    table.decimal('minimumPayout', 15, 2).defaultTo(50);
    table.string('currency').defaultTo('USD');
    table.text('bio');
    table.jsonb('categories');
    table.text('rejectionReason');
    table.timestamp('approvedAt');
    table.uuid('approvedBy');
    table.timestamp('lastLoginAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('email');
    table.index('affiliateCode');
    table.index('status');
    table.index('customerId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('marketingAffiliate');
};
