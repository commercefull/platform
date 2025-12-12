/**
 * VAT OSS Report Line Table
 * Breakdown of VAT OSS report by consumption country and VAT rate
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('vatOssReportLine', t => {
    t.uuid('vatOssReportLineId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('vatOssReportId').notNullable().references('vatOssReportId').inTable('vatOssReport').onDelete('CASCADE');
    // Country where customer is located (consumption country)
    t.string('consumptionCountry', 2).notNullable();
    // VAT rate type and rate
    t.enum('vatRateType', [
      'standard',      // Standard rate
      'reduced',       // Reduced rate
      'super_reduced', // Super reduced rate
      'zero'           // Zero rate
    ]).notNullable();
    t.decimal('vatRate', 5, 2).notNullable(); // Actual rate percentage
    // Amounts
    t.decimal('taxableAmount', 15, 2).notNullable(); // Sales excl. VAT
    t.decimal('vatAmount', 15, 2).notNullable();
    t.decimal('grossAmount', 15, 2).notNullable(); // Sales incl. VAT
    // Statistics
    t.integer('orderCount').notNullable().defaultTo(0);
    t.integer('itemCount').notNullable().defaultTo(0);
    // Currency (for reference, OSS reports in EUR)
    t.string('currency', 3).notNullable().defaultTo('EUR');
    t.decimal('exchangeRate', 15, 6).defaultTo(1); // Rate to EUR
    
    t.index('vatOssReportId');
    t.index('consumptionCountry');
    t.index('vatRateType');
    t.unique(['vatOssReportId', 'consumptionCountry', 'vatRateType', 'vatRate']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('vatOssReportLine');
};
