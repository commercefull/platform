/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentCategorization', t => {
    t.uuid('contentCategorizationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('contentPageId').notNullable().references('contentPageId').inTable('contentPage').onDelete('CASCADE');
    t.uuid('categoryId').notNullable().references('contentCategoryId').inTable('contentCategory').onDelete('CASCADE');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.index('contentPageId');
    t.index('categoryId');
    t.unique(['contentPageId', 'categoryId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentCategorization');
};
