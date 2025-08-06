/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerConsent', t => {
    t.uuid('customerConsentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.enum('type', [
      'terms', 'privacy', 'marketing', 'cookies', 'dataProcessing', 
      'thirdParty', 'ageVerification', 'sms', 'phoneCalls', 'personalization'
    ]).notNullable();
    t.boolean('given').notNullable();
    t.string('ipAddress', 50);
    t.string('userAgent', 255);
    t.string('source', 100);
    t.string('version', 50);
    t.text('docUrl');
    t.timestamp('expiresAt');
    t.timestamp('withdrawnAt');
    t.jsonb('additionalData');
    t.index('customerId');
    t.index('type');
    t.index('given');
    t.index('version');
    t.index('expiresAt');
    t.index('withdrawnAt');
    t.unique(['customerId', 'type', 'version']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerConsent');
};
