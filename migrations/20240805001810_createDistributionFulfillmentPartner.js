/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionFulfillmentPartner', table => {
    table.uuid('distributionFulfillmentPartnerId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deletedAt').nullable();

    // Basic info
    table.string('name', 255).notNullable();
    table.string('code', 100).notNullable().unique();
    table.text('description').nullable();
    table.boolean('isActive').defaultTo(true).notNullable();

    // Contact information
    table.string('contactName', 255).nullable();
    table.string('contactEmail', 255).nullable();
    table.string('contactPhone', 50).nullable();

    // API integration
    table.string('apiKey', 500).nullable();
    table.string('apiSecret', 500).nullable();
    table.string('apiEndpoint', 500).nullable();
    table.jsonb('apiCredentials').nullable();

    // Capabilities
    table.specificType('supportedCarriers', 'text[]').nullable();
    table.specificType('supportedRegions', 'text[]').nullable();
    table.specificType('supportedServices', 'text[]').nullable();
    table.boolean('supportsReturns').defaultTo(false).notNullable();
    table.boolean('supportsInternational').defaultTo(false).notNullable();
    table.boolean('supportsTracking').defaultTo(true).notNullable();

    // SLA and performance
    table.integer('averageProcessingTimeHours').nullable();
    table.decimal('fulfillmentRate', 5, 2).nullable();
    table.decimal('onTimeDeliveryRate', 5, 2).nullable();

    // Costs
    table.decimal('baseFee', 10, 2).nullable();
    table.decimal('perOrderFee', 10, 2).nullable();
    table.decimal('perItemFee', 10, 2).nullable();
    table.string('currency', 3).defaultTo('USD').notNullable();

    // Settings
    table.jsonb('settings').nullable();
    table.jsonb('metadata').nullable();

    // Audit
    table.string('createdBy', 255).nullable();

    // Indexes
    table.index('code');
    table.index('isActive');
    table.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('distributionFulfillmentPartner');
};
