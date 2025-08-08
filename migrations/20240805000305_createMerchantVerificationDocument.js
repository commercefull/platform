/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantVerificationDocument', t => {
    t.uuid('merchantVerificationDocumentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.enum('documentType', ['businessLicense', 'taxId', 'idProof', 'addressProof', 'bankStatement', 'other']).notNullable();
    t.string('documentName', 255).notNullable();
    t.text('description');
    t.text('fileUrl').notNullable();
    t.string('fileType', 50);
    t.integer('fileSize');
    t.timestamp('uploadedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiryDate');
    t.enum('verificationStatus', ['pending', 'approved', 'rejected', 'expired']).notNullable().defaultTo('pending');
    t.timestamp('reviewedAt');
    t.uuid('reviewedBy');
    t.text('reviewNotes');
    
    t.index('merchantId');
    t.index('documentType');
    t.index('uploadedAt');
    t.index('expiryDate');
    t.index('verificationStatus');
    t.index('reviewedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantVerificationDocument');
};
