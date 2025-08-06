/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shipping_carrier', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
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
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('hasApiIntegration');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shipping_carrier');
};
