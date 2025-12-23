/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('b2bCompany', function (table) {
    table.uuid('b2bCompanyId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name').notNullable();
    table.string('legalName');
    table.string('registrationNumber');
    table.string('vatNumber');
    table.string('taxId');
    table.string('dunsNumber');
    table.string('status').defaultTo('pending').checkIn(['pending', 'active', 'suspended', 'closed']);
    table
      .string('companyType')
      .defaultTo('corporation')
      .checkIn(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'nonprofit', 'government', 'other']);
    table.string('industry');
    table.string('industryCode');
    table.integer('employeeCount');
    table.string('employeeRange').checkIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);
    table.decimal('annualRevenue', 15, 2);
    table.string('revenueRange');
    table.decimal('creditLimit', 15, 2).defaultTo(0);
    table.decimal('availableCredit', 15, 2).defaultTo(0);
    table.decimal('usedCredit', 15, 2).defaultTo(0);
    table.integer('paymentTermsDays').defaultTo(30);
    table.string('paymentTermsType').defaultTo('prepaid').checkIn(['prepaid', 'net', 'cod', 'credit']);
    table.string('currency', 3).defaultTo('USD');
    table.uuid('primaryContactId');
    table.uuid('billingContactId');
    table.string('website');
    table.string('phone');
    table.string('fax');
    table.string('email');
    table.string('logoUrl');
    table.text('description');
    table.text('notes');
    table.jsonb('metadata');
    table.jsonb('customFields');
    table.boolean('taxExempt').defaultTo(false);
    table.string('taxExemptCertificate');
    table.date('taxExemptExpiry');
    table.uuid('parentCompanyId').references('b2bCompanyId').inTable('b2bCompany').onDelete('SET NULL');
    table.uuid('accountManagerId');
    table.string('tier').defaultTo('standard').checkIn(['standard', 'silver', 'gold', 'platinum', 'enterprise']);
    table.decimal('discountRate', 5, 2).defaultTo(0);
    table.boolean('requiresApproval').defaultTo(false);
    table.decimal('orderMinimum', 15, 2);
    table.decimal('orderMaximum', 15, 2);
    table.timestamp('approvedAt');
    table.uuid('approvedBy');
    table.timestamp('lastOrderAt');
    table.integer('totalOrders').defaultTo(0);
    table.decimal('lifetimeValue', 15, 2).defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('name');
    table.index('status');
    table.index('vatNumber');
    table.index('companyType');
    table.index('tier');
    table.index('parentCompanyId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('b2bCompany');
};
