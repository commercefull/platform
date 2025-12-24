/**
 * Migration: Create Organization Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('organization');
  if (hasTable) return;

  await knex.schema.createTable('organization', table => {
    table.uuid('organizationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.string('type', 50).defaultTo('single'); // 'single', 'multi_store', 'marketplace', 'b2b'
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.index('slug');
    table.index('type');
  });

  // Insert default organization
  const existingOrg = await knex('organization').where('slug', 'default').first();
  if (!existingOrg) {
    await knex('organization').insert({
      name: 'Default Organization',
      slug: 'default',
      type: 'single',
      settings: JSON.stringify({}),
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('organization');
};
