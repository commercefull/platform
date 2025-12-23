/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('faqArticle', function (table) {
    table.uuid('faqArticleId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('faqCategoryId').references('faqCategoryId').inTable('faqCategory').onDelete('SET NULL');
    table.string('title').notNullable();
    table.string('slug').unique();
    table.text('content').notNullable();
    table.text('contentHtml');
    table.string('excerpt');
    table.specificType('keywords', 'text[]');
    table.specificType('relatedArticleIds', 'uuid[]');
    table.integer('views').defaultTo(0);
    table.integer('uniqueViews').defaultTo(0);
    table.integer('helpfulYes').defaultTo(0);
    table.integer('helpfulNo').defaultTo(0);
    table.decimal('helpfulScore', 5, 4).defaultTo(0);
    table.integer('sortOrder').defaultTo(0);
    table.boolean('isPublished').defaultTo(false);
    table.boolean('isFeatured').defaultTo(false);
    table.boolean('isPinned').defaultTo(false);
    table.timestamp('publishedAt');
    table.uuid('authorId');
    table.string('authorName');
    table.uuid('lastEditedBy');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('faqCategoryId');
    table.index('slug');
    table.index('isPublished');
    table.index('views');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('faqArticle');
};
