exports.up = function (knex) {
  return knex.schema.createTable('customerTaxExemption', t => {
    t.uuid('customerTaxExemptionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('taxZoneId').references('taxZoneId').inTable('taxZone').onDelete('SET NULL');
    t.enum('type', [
      'business',
      'individual',
      'resale',
      'diplomatic',
      'nonprofit',
      'vatReverseCharge',
      'agricultural',
      'manufacturing',
      'government',
      'educational',
      'medical',
      'export',
    ]).notNullable();
    t.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    t.string('name', 100).notNullable();
    t.string('exemptionNumber', 100).notNullable();
    t.string('businessName', 255);
    t.text('exemptionReason');
    t.text('documentUrl');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiryDate');
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.uuid('verifiedBy').references('organizationId').inTable('organization');
    t.timestamp('verifiedAt');
    t.text('notes');
    t.jsonb('applicableTaxCategoryIds');
    t.decimal('minOrderAmount', 15, 2);
    t.decimal('maxOrderAmount', 15, 2);
    t.decimal('exemptionPercent', 5, 2).notNullable().defaultTo(100);

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

exports.down = function (knex) {
  return knex.schema.dropTable('customerTaxExemption');
};
