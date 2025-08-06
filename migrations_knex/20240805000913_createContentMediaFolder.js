/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentMediaFolder', t => {
    t.uuid('contentMediaFolderId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.uuid('parentId').references('contentMediaFolderId').inTable('contentMediaFolder');
    t.string('path', 255);
    t.integer('depth').notNullable().defaultTo(0);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('parentId');
    t.index('path');
    t.unique(['parentId', 'name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentMediaFolder');
};
