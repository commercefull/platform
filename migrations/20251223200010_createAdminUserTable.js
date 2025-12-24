/**
 * Migration: Create Admin User Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('adminUser');
  if (hasTable) return;

  await knex.schema.createTable('adminUser', table => {
    table.uuid('adminId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('email', 255).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('passwordHash', 255).notNullable();
    table.string('role', 30).notNullable().defaultTo('admin'); // 'super_admin', 'admin', 'support', 'operations'
    table.jsonb('permissions').defaultTo('[]');
    table.string('status', 20).notNullable().defaultTo('active'); // 'active', 'inactive', 'suspended'
    table.timestamp('lastLoginAt').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.index('email');
    table.index('role');
    table.index('status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('adminUser');
};
