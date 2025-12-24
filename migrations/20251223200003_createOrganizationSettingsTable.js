/**
 * Migration: Create Organization Settings Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('organizationSettings');
  if (hasTable) return;

  await knex.schema.createTable('organizationSettings', table => {
    table.uuid('settingId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable();
    table.string('category', 50).notNullable(); // 'billing', 'shipping', 'notifications', 'integrations'
    table.string('key', 100).notNullable();
    table.text('value').nullable();
    table.jsonb('valueJson').nullable();
    table.boolean('isEncrypted').defaultTo(false);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['organizationId', 'category', 'key']);
    table.index('organizationId');
    table.index('category');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('organizationSettings');
};
