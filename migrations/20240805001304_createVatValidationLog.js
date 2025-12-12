/**
 * VAT Validation Log Table
 * Tracks all VAT number validations (VIES, HMRC, etc.) for audit trail
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('vatValidationLog', t => {
    t.uuid('vatValidationLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    // Who requested validation
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
    t.uuid('merchantId').references('merchantId').inTable('merchant').onDelete('SET NULL');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    // VAT number being validated
    t.string('vatNumber', 50).notNullable();
    t.string('countryCode', 2).notNullable();
    t.string('vatNumberFormatted', 50); // Normalized format
    // Validation result
    t.boolean('isValid');
    t.enum('validationStatus', [
      'valid',
      'invalid',
      'unavailable',    // Service unavailable
      'timeout',        // Service timeout
      'error',          // Other error
      'format_invalid'  // Failed format check before API call
    ]).notNullable();
    // Validation source
    t.enum('validationSource', [
      'vies',     // EU VIES service
      'hmrc',     // UK HMRC
      'manual',   // Manual verification
      'cache',    // From cached result
      'format'    // Format-only check
    ]).notNullable();
    t.string('requestId', 100); // External API request ID
    t.jsonb('response'); // Full API response
    // Company details returned (if available)
    t.string('companyName', 255);
    t.text('companyAddress');
    t.string('companyCity', 100);
    t.string('companyPostalCode', 20);
    // Timing
    t.timestamp('validatedAt').notNullable();
    t.integer('responseTimeMs'); // API response time
    t.timestamp('expiresAt'); // When this validation expires (cache TTL)
    // For B2B reverse charge
    t.boolean('reverseChargeApplicable').defaultTo(false);
    // Audit
    t.string('ipAddress', 50);
    t.string('context', 50); // checkout, registration, admin, api
    
    t.index('vatNumber');
    t.index('customerId');
    t.index('merchantId');
    t.index('orderId');
    t.index('countryCode');
    t.index('isValid');
    t.index('validatedAt');
    t.index(['vatNumber', 'countryCode', 'validatedAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('vatValidationLog');
};
