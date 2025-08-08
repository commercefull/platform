/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentType', t => {
    t.uuid('contentTypeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.text('description');
    t.string('icon', 50);
    t.specificType('allowedBlocks', 'text[]');
    t.uuid('defaultTemplate');
    t.jsonb('requiredFields');
    t.jsonb('metaFields');
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('slug');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentType');
};
