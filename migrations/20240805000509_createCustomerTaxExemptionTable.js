exports.up = function(knex) {
  return knex.schema.createTable('customerTaxExemption', t => {
    t.uuid('customerTaxExemptionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('taxZoneId').references('taxZoneId').inTable('taxZone').onDelete('SET NULL');
    t.enum('type', ['business', 'individual']).notNullable();
    t.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    t.string('name', 100).notNullable();
    t.string('exemptionNumber', 100).notNullable();
    t.string('businessName', 255);
    t.text('exemptionReason');
    t.text('documentUrl');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiryDate');
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.uuid('verifiedBy').references('merchantId').inTable('merchant');
    t.timestamp('verifiedAt');
    t.text('notes');

    t.index('customerId');
    t.index('taxZoneId');
    t.index('type');
    t.index('status');
    t.index('exemptionNumber');
    t.index('startDate');
    t.index('expiryDate');
    t.index('isVerified');
    t.index('verifiedBy');
    t.index('verifiedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerTaxExemption');
};
