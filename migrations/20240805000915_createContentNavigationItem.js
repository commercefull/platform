/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentNavigationItem', t => {
    t.uuid('contentNavigationItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('navigationId').notNullable().references('contentNavigationId').inTable('contentNavigation').onDelete('CASCADE');
    t.uuid('parentId').references('contentNavigationItemId').inTable('contentNavigationItem');
    t.string('title', 255).notNullable();
    t.enum('type', ['url', 'page', 'category', 'product', 'blog']).notNullable().defaultTo('url');
    t.text('url');
    t.uuid('contentPageId').references('contentPageId').inTable('contentPage');
    t.uuid('targetId');
    t.string('targetSlug', 255);
    t.string('icon', 50);
    t.text('cssClasses');
    t.boolean('openInNewTab').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.jsonb('conditions');
    t.integer('depth').notNullable().defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('navigationId');
    t.index('parentId');
    t.index('contentPageId');
    t.index('targetId');
    t.index('targetSlug');
    t.index('isActive');
    t.index(['navigationId', 'sortOrder']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentNavigationItem');
};
