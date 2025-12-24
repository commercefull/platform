/**
 * Migration: Create B2B User Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bUser');
  if (hasTable) return;

  await knex.schema.createTable('b2bUser', table => {
    table.uuid('b2bUserId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').notNullable();
    table.string('email', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('passwordHash', 255).nullable(); // Nullable for invited users
    table.string('role', 30).notNullable().defaultTo('buyer'); // 'admin', 'buyer', 'approver'
    table.jsonb('permissions').defaultTo('[]');
    table.decimal('spendingLimit', 12, 2).nullable();
    table.string('status', 20).notNullable().defaultTo('invited'); // 'invited', 'active', 'inactive', 'suspended'
    table.string('inviteToken', 100).nullable();
    table.timestamp('invitedAt').nullable();
    table.timestamp('activatedAt').nullable();
    table.timestamp('lastLoginAt').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.unique(['b2bCompanyId', 'email']);
    table.index('b2bCompanyId');
    table.index('email');
    table.index('role');
    table.index('status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bUser');
};
