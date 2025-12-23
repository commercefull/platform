/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionShippingCarrier', table => {
    table.uuid('distributionShippingCarrierId').primary().defaultTo(knex.raw('uuidv7()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();

    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.text('description').nullable();
    table.string('websiteUrl', 255).nullable();
    table.string('trackingUrl', 500).nullable();
    table.boolean('isActive').defaultTo(true).notNullable();
    table.string('accountNumber', 100).nullable();
    table.jsonb('apiCredentials').nullable();
    table.jsonb('supportedRegions').nullable();
    table.jsonb('supportedServices').nullable();
    table.boolean('requiresContract').defaultTo(false).notNullable();
    table.boolean('hasApiIntegration').defaultTo(false).notNullable();
    table.jsonb('customFields').nullable();
    table.uuid('createdBy').nullable();

    table.index('code');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distributionShippingCarrier');
};
