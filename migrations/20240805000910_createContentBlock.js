/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentBlock', t => {
    t.uuid('contentBlockId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('contentPageId').notNullable().references('contentPageId').inTable('contentPage').onDelete('CASCADE');
    t.uuid('blockTypeId').notNullable().references('contentBlockTypeId').inTable('contentBlockType');
    t.string('title', 255);
    t.string('area', 100).notNullable().defaultTo('main');
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.jsonb('content').notNullable().defaultTo('{}');
    t.jsonb('settings').defaultTo('{}');
    t.boolean('isVisible').notNullable().defaultTo(true);
    t.text('cssClasses');
    t.jsonb('conditions');
    t.uuid('parentBlockId').references('contentBlockId').inTable('contentBlock');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('contentPageId');
    t.index('blockTypeId');
    t.index('area');
    t.index('parentBlockId');
    t.index(['contentPageId', 'area', 'sortOrder']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentBlock');
};
