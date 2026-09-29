/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('importMapping', t => {
    t.uuid('importMappingId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('importJobId').notNullable().references('importJobId').inTable('importJob').onDelete('CASCADE');
    t.string('entityType', 100).notNullable();
    t.string('sourceId', 255).notNullable();
    t.uuid('platformId').notNullable();
    t.jsonb('sourceData');
    t.jsonb('metadata');

    t.index('importJobId');
    t.index('entityType');
    t.index('sourceId');
    t.index('platformId');
    t.unique(['importJobId', 'entityType', 'sourceId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('importMapping');
};
