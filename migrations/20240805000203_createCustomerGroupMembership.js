/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerGroupMembership', t => {
    t.uuid('customerGroupMembershipId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('customerGroupId').notNullable().references('customerGroupId').inTable('customerGroup').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    
    t.timestamp('expiresAt');
    t.uuid('addedBy');
    t.timestamp('deletedAt');
    t.index('customerId');
    t.index('customerGroupId');
    t.index('isActive');
    t.index('expiresAt');
    t.index('deletedAt');
    t.unique(['customerId', 'customerGroupId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerGroupMembership');
};
