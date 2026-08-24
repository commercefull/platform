/**
 * Create pageDraft table for the page builder module.
 * Stores page builder drafts with blocks as JSONB.
 */

export async function up(knex) {
  await knex.schema.createTable('pageDraft', (table) => {
    table.uuid('draftId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pageId').nullable();
    table.uuid('storeId').notNullable();
    table.uuid('organizationId').notNullable();
    table.uuid('themeId').notNullable();
    table.string('title').notNullable();
    table.string('slug').notNullable();
    table.string('pageType').notNullable().defaultTo('page');
    table.string('status').notNullable().defaultTo('draft');
    table.jsonb('blocks').notNullable().defaultTo('[]');
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('publishedAt').nullable();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['storeId', 'status']);
    table.index(['organizationId', 'status']);
    table.index(['slug', 'storeId']);
    table.index('pageId');
    table.index('themeId');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('pageDraft');
}
