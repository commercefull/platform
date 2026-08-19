/**
 * Migration: Create Organization Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('organization');

  if (!hasTable) {
    await knex.schema.createTable('organization', table => {
      table.uuid('organizationId').primary().defaultTo(knex.raw('uuidv7()'));
      table.string('name', 255).notNullable();
      table.string('slug', 100).unique().notNullable();
      table.string('type', 50).defaultTo('single');
      table.jsonb('settings').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      table.timestamp('deletedAt').nullable();

      table.index('slug');
      table.index('type');
    });
  } else {
    // Table already exists (from renamed merchant migration) — add missing columns
    const hasType = await knex.schema.hasColumn('organization', 'type');
    if (!hasType) {
      await knex.schema.alterTable('organization', table => {
        table.string('type', 50).defaultTo('single');
      });
    }
    const hasDeletedAt = await knex.schema.hasColumn('organization', 'deletedAt');
    if (!hasDeletedAt) {
      await knex.schema.alterTable('organization', table => {
        table.timestamp('deletedAt').nullable();
      });
    }
    const hasSettings = await knex.schema.hasColumn('organization', 'settings');
    if (!hasSettings) {
      await knex.schema.alterTable('organization', table => {
        table.jsonb('settings').defaultTo('{}');
      });
    }
  }

};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('organization');
};
