/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentBlockType', t => {
    t.uuid('contentBlockTypeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.text('description');
    t.string('icon', 50);
    t.string('category', 100);
    t.jsonb('defaultConfig');
    t.jsonb('schema');
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('slug');
    t.index('category');
    t.index('isActive');
    t.index('sortOrder');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentBlockType');
};
