/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentCategory', t => {
    t.uuid('contentCategoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.uuid('parentId').references('contentCategoryId').inTable('contentCategory');
    t.text('description');
    t.text('featuredImage');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('path', 255);
    t.integer('depth').notNullable().defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('slug');
    t.index('parentId');
    t.index('isActive');
    t.index('path');
    t.unique(['parentId', 'slug']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentCategory');
};
