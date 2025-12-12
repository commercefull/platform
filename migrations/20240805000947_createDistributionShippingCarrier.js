/**
 * Distribution Shipping Carrier Migration
 * Creates the distributionShippingCarrier table for shipping carrier management
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionShippingCarrier', t => {
    t.uuid('distributionShippingCarrierId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.text('websiteUrl');
    t.text('trackingUrl');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('accountNumber', 100);
    t.jsonb('apiCredentials');
    t.jsonb('supportedRegions');
    t.jsonb('supportedServices');
    t.boolean('requiresContract').notNullable().defaultTo(false);
    t.boolean('hasApiIntegration').notNullable().defaultTo(false);
    t.jsonb('customFields');
    
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('hasApiIntegration');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionShippingCarrier');
};
