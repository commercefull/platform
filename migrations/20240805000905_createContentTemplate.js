/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentTemplate', t => {
    t.uuid('contentTemplateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable().unique();
    t.text('description');
    t.text('thumbnail');
    t.text('htmlStructure');
    t.text('cssStyles');
    t.text('jsScripts');
    t.jsonb('areas');
    t.jsonb('defaultBlocks');
    t.specificType('compatibleContentTypes', 'text[]');
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
  return knex.schema.dropTable('contentTemplate');
};
