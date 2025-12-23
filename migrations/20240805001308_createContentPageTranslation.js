/**
 * Content Page Translation Table
 * Stores multi-language translations for CMS content pages
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('contentPageTranslation', t => {
    t.uuid('contentPageTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('contentPageId').notNullable().references('contentPageId').inTable('contentPage').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('title', 255).notNullable();
    t.string('slug', 255);
    t.text('summary');
    // The actual content blocks (JSON structure)
    t.jsonb('content');
    // SEO translations
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 500);
    t.text('openGraphTitle');
    t.text('openGraphDescription');
    // Featured image can be locale-specific
    t.text('featuredImage');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    t.boolean('isPublished').notNullable().defaultTo(false);
    t.timestamp('publishedAt');

    t.index('contentPageId');
    t.index('localeId');
    t.index('slug');
    t.index('isPublished');
    t.unique(['contentPageId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('contentPageTranslation');
};
