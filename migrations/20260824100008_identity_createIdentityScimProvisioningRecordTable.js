/**
 * Create SCIM Provisioning Record table
 */

exports.up = function (knex) {
  return knex.schema.createTable('identityScimProvisioningRecord', table => {
    table.uuid('recordId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable().index();
    table.uuid('userId').notNullable().index();
    table.string('userType').notNullable().defaultTo('organization');
    table.string('scimUserId').notNullable().unique();
    table.string('externalId');
    table.string('source').notNullable();
    table.uuid('providerId');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('identityScimProvisioningRecord');
};
