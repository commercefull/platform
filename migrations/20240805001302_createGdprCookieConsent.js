/**
 * GDPR Cookie Consent Table
 * Tracks cookie consent for both authenticated and anonymous users
 * Separate from customerConsent to handle pre-login cookie consent
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('gdprCookieConsent', t => {
    t.uuid('gdprCookieConsentId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    // Can be null for anonymous users
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    // Session/browser identifier for anonymous users
    t.string('sessionId', 100);
    t.string('browserFingerprint', 255);
    // Cookie categories (EU ePrivacy Directive compliant)
    t.boolean('necessary').notNullable().defaultTo(true); // Always true, cannot be declined
    t.boolean('functional').notNullable().defaultTo(false);
    t.boolean('analytics').notNullable().defaultTo(false);
    t.boolean('marketing').notNullable().defaultTo(false);
    t.boolean('thirdParty').notNullable().defaultTo(false);
    // Audit information
    t.string('ipAddress', 50);
    t.string('userAgent', 500);
    t.string('country', 2); // Detected country for compliance rules
    t.string('region', 50); // State/province for US state laws
    // Consent details
    t.string('consentBannerVersion', 20); // Version of banner shown
    t.string('consentMethod', 30); // banner, settings, api
    t.timestamp('consentedAt').notNullable();
    t.timestamp('expiresAt'); // Consent should be renewed periodically
    // For linking anonymous to authenticated
    t.timestamp('linkedAt'); // When anonymous consent was linked to customer
    
    t.index('customerId');
    t.index('sessionId');
    t.index('browserFingerprint');
    t.index('country');
    t.index('consentedAt');
    t.index(['sessionId', 'consentedAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('gdprCookieConsent');
};
