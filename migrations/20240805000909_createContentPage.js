/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentPage', t => {
    t.uuid('contentPageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('title', 255).notNullable();
    t.string('slug', 255).notNullable();
    t.uuid('contentTypeId').notNullable().references('contentTypeId').inTable('contentType');
    t.uuid('templateId').references('contentTemplateId').inTable('contentTemplate');
    t.enum('status', ['draft', 'published', 'scheduled', 'archived']).notNullable().defaultTo('draft');
    t.enum('visibility', ['public', 'private', 'passwordProtected']).notNullable().defaultTo('public');
    t.string('accessPassword', 255);
    t.text('summary');
    t.text('featuredImage');
    t.uuid('parentId').references('contentPageId').inTable('contentPage');
    t.integer('sortOrder').defaultTo(0);
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.text('metaKeywords');
    t.text('openGraphImage');
    t.text('canonicalUrl');
    t.boolean('noIndex').defaultTo(false);
    t.jsonb('customFields');
    t.timestamp('publishedAt');
    t.timestamp('scheduledAt');
    t.timestamp('expiresAt');
    t.boolean('isHomePage').defaultTo(false);
    t.string('path', 255);
    t.integer('depth').defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.uuid('updatedBy');
    t.uuid('publishedBy');
    t.index('slug');
    t.index('contentTypeId');
    t.index('templateId');
    t.index('status');
    t.index('parentId');
    t.index('path');
    t.index('publishedAt');
    t.unique(['parentId', 'slug']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentPage');
};
