/**
 * Migration: Create User Session Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('userSession');
  if (hasTable) return;

  await knex.schema.createTable('userSession', table => {
    table.uuid('sessionId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('userId').notNullable();
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
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('userSession');
};
