/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantTaxInfo', t => {
    t.uuid('merchantTaxInfoId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.enu('taxIdentificationType', ['ssn', 'ein', 'tin', 'vat', 'gst', 'other'], { useNative: true, enumName: 'merchant_tax_id_type' }).notNullable();
    t.string('taxIdentificationNumber', 255).notNullable();
    t.enu('businessType', ['individual', 'sole_proprietorship', 'partnership', 'llc', 'corporation', 'non_profit'], { useNative: true, enumName: 'merchant_business_type' });
    t.string('legalName', 100).notNullable();
    t.jsonb('taxAddress').notNullable();
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.timestamp('verifiedAt');
    t.uuid('verifiedBy');
    t.text('verificationNotes');
    t.boolean('taxFormFiled').notNullable().defaultTo(false);
    t.string('taxFormType', 20);
    t.timestamp('taxFormFiledAt');
    t.boolean('taxExempt').notNullable().defaultTo(false);
    t.text('taxExemptionReason');
    t.jsonb('metadata');
    t.index('merchantId');
    t.index('taxIdentificationType');
    t.index('taxIdentificationNumber');
    t.index('businessType');
    t.index('legalName');
    t.index('isVerified');
    t.index('taxFormFiled');
    t.index('taxExempt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantTaxInfo')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS merchant_tax_id_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS merchant_business_type'));
};
