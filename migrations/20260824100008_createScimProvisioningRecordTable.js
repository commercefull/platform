/**
 * Create SCIM Provisioning Record table
 */

exports.up = function (knex) {
  return knex.schema.createTable('scimProvisioningRecord', (table) => {
    table.string('recordId').primary();
    table.string('organizationId').notNullable().index();
    table.string('userId').notNullable().index();
    table.string('userType').notNullable().defaultTo('organization');
    table.string('scimUserId').notNullable().unique();
    table.string('externalId');
    table.string('source').notNullable();
    table.string('providerId');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('scimProvisioningRecord');
};
