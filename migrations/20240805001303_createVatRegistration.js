/**
 * VAT Registration Table
 * Tracks merchant VAT registrations per country for EU/UK compliance
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('vatRegistration', t => {
    t.uuid('vatRegistrationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    // Registration details
    t.string('countryCode', 2).notNullable(); // ISO country code
    t.string('vatNumber', 50).notNullable();
    t.string('tradingName', 255);
    t.string('legalName', 255);
    // Registration type
    t.enum('registrationType', [
      'standard', // Standard VAT registration
      'oss', // EU One-Stop Shop
      'ioss', // Import One-Stop Shop (for imports < €150)
      'moss', // Mini One-Stop Shop (legacy, pre-2021)
      'non_union', // Non-Union OSS scheme
      'distance_selling', // Distance selling threshold
    ])
      .notNullable()
      .defaultTo('standard');
    // Verification
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.timestamp('verifiedAt');
    t.string('verificationSource', 50); // vies, hmrc, manual, api
    t.string('verificationRequestId', 100); // External API request ID
    t.jsonb('verificationResponse'); // Full API response for audit
    // Registration dates
    t.date('registrationDate');
    t.date('deregistrationDate');
    t.date('effectiveFrom'); // When registration becomes effective
    t.date('effectiveUntil'); // For temporary registrations
    // Thresholds (for distance selling)
    t.decimal('annualThreshold', 15, 2); // Threshold amount
    t.string('thresholdCurrency', 3).defaultTo('EUR');
    t.decimal('currentYearSales', 15, 2).defaultTo(0);
    t.boolean('thresholdExceeded').defaultTo(false);
    // Status
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('notes');
    // Document storage
    t.string('certificateUrl', 500); // VAT registration certificate

    t.index('merchantId');
    t.index('countryCode');
    t.index('vatNumber');
    t.index('registrationType');
    t.index('isVerified');
    t.index('isActive');
    t.unique(['merchantId', 'countryCode', 'registrationType']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('vatRegistration');
};
