/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('media', t => {
    t.uuid('mediaId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('originalName', 255).notNullable();
    t.string('mimeType', 100).notNullable();
    t.bigInteger('size').notNullable();
    t.text('originalUrl').notNullable();
    t.jsonb('processedFiles').defaultTo('[]');
    t.text('thumbnailUrl');
    t.string('altText', 255);
    t.string('title', 255);
    t.text('description');
    t.specificType('tags', 'text[]').defaultTo('{}');
    t.jsonb('metadata').defaultTo('{}');

    t.index('mimeType');
    t.index('createdAt');
    t.index('tags', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('media');
};
