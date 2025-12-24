/**
 * Migration: Create Organization Member Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('organizationMember');
  if (hasTable) return;

  await knex.schema.createTable('organizationMember', table => {
    table.uuid('memberId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable();
    table.uuid('userId').notNullable();
    table.string('role', 50).notNullable(); // 'owner', 'admin', 'manager', 'member'
    table.jsonb('permissions').defaultTo('[]');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('invitedAt').nullable();
    table.timestamp('acceptedAt').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['organizationId', 'userId']);
    table.index('organizationId');
    table.index('userId');
    table.index('role');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('organizationMember');
};
