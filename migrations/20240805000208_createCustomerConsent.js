/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerConsent', t => {
    t.uuid('customerConsentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    // Extended consent types for GDPR compliance
    t.enum('type', [
      'terms', 'privacy', 'marketing', 'cookies', 'dataProcessing', 
      'thirdParty', 'ageVerification', 'sms', 'phoneCalls', 'personalization',
      // GDPR-specific consent types
      'analyticsCookies', 'functionalCookies', 'marketingCookies',
      'dataPortability', 'dataDeletion', 'profileAnalysis',
      'crossBorderTransfer', 'automatedDecision'
    ]).notNullable();
    t.boolean('given').notNullable();
    t.string('ipAddress', 50);
    t.string('userAgent', 255);
    t.string('source', 100); // signup, checkout, banner, settings, profile
    t.string('version', 50); // Version of consent text
    t.text('docUrl');
    t.timestamp('expiresAt');
    t.timestamp('withdrawnAt');
    t.jsonb('additionalData');
    // GDPR audit fields
    t.string('legalBasis', 50); // consent, contract, legal_obligation, vital_interest, public_task, legitimate_interest
    t.text('consentText'); // Exact text shown to user
    t.string('country', 2); // Country where consent was given (for compliance)
    t.index('customerId');
    t.index('type');
    t.index('given');
    t.index('version');
    t.index('expiresAt');
    t.index('withdrawnAt');
    t.index('legalBasis');
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
