/**
 * Migration: Create Admin User and Session Tables
 * Adds tables for platform administrators and session management
 */

exports.up = async function (knex) {
  // Create adminUser table
  const hasAdminUser = await knex.schema.hasTable('adminUser');
  if (!hasAdminUser) {
    await knex.schema.createTable('adminUser', table => {
      table.string('adminId', 50).primary();
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
  }

  // Create userSession table for web app sessions
  const hasUserSession = await knex.schema.hasTable('userSession');
  if (!hasUserSession) {
    await knex.schema.createTable('userSession', table => {
      table.string('sessionId', 50).primary();
      table.string('userId', 50).notNullable();
      table.string('userType', 20).notNullable(); // 'admin', 'merchant', 'b2b', 'customer'
      table.string('email', 255).notNullable();
      table.string('name', 255).nullable();
      table.string('role', 50).nullable();
      table.string('merchantId', 50).nullable();
      table.string('companyId', 50).nullable();
      table.jsonb('permissions').defaultTo('[]');
      table.timestamp('expiresAt').notNullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('lastActivityAt').defaultTo(knex.fn.now());
      table.string('userAgent', 500).nullable();
      table.string('ipAddress', 50).nullable();

      table.index('userId');
      table.index('userType');
      table.index('expiresAt');
      table.index(['userId', 'userType']);
    });
  }

  // Create b2bUser table for B2B company users
  const hasB2bUser = await knex.schema.hasTable('b2bUser');
  if (!hasB2bUser) {
    await knex.schema.createTable('b2bUser', table => {
      table.string('b2bUserId', 50).primary();
      table.string('b2bCompanyId', 50).notNullable();
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
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bUser');
  await knex.schema.dropTableIfExists('userSession');
  await knex.schema.dropTableIfExists('adminUser');
};
