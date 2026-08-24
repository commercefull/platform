/**
 * Create trackingConfig table
 */
exports.up = function (knex) {
  return knex.schema.createTable('trackingConfig', (table) => {
    table.string('configId').primary();
    table.string('storeId').notNullable().unique();
    table.string('organizationId').notNullable();
    table.string('status').notNullable().defaultTo('active');
    table.jsonb('gtm').nullable();
    table.jsonb('metaCapi').nullable();
    table.jsonb('eventMappings').notNullable().defaultTo('[]');
    table.string('defaultConsentCategory').notNullable().defaultTo('marketing');
    table.boolean('hashPii').notNullable().defaultTo(true);
    table.boolean('serverSideEnabled').notNullable().defaultTo(true);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index('storeId');
    table.index('organizationId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('trackingConfig');
};
