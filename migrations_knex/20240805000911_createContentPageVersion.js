/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentPageVersion', t => {
    t.uuid('contentPageVersionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('contentPageId').notNullable().references('contentPageId').inTable('contentPage').onDelete('CASCADE');
    t.integer('version').notNullable();
    t.string('title', 255).notNullable();
    t.string('status', 20).notNullable();
    t.text('summary');
    t.jsonb('content');
    t.jsonb('customFields');
    t.text('comment');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.index('contentPageId');
    t.unique(['contentPageId', 'version']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentPageVersion');
};
