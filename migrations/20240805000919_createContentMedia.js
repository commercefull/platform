/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentMedia', t => {
    t.uuid('contentMediaId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('title', 255).notNullable();
    t.string('fileName', 255).notNullable();
    t.text('filePath').notNullable();
    t.string('fileType', 100).notNullable();
    t.integer('fileSize').notNullable();
    t.integer('width');
    t.integer('height');
    t.integer('duration');
    t.text('altText');
    t.text('caption');
    t.text('description');
    t.uuid('contentMediaFolderId').references('contentMediaFolderId').inTable('contentMediaFolder').onDelete('SET NULL');
    t.text('url').notNullable();
    t.text('thumbnailUrl');
    t.integer('sortOrder').notNullable().defaultTo(0);

    t.specificType('tags', 'text[]');
    t.boolean('isExternal').notNullable().defaultTo(false);
    t.string('externalService', 100);
    t.string('externalId', 255);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.index('fileName');
    t.index('fileType');
    t.index('contentMediaFolderId');
    t.index('tags', null, 'gin'); // Use GIN index for array
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentMedia');
};
