/**
 * Category Translation Table
 * Stores multi-language translations for product categories
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('categoryTranslation', t => {
    t.uuid('categoryTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('name', 255).notNullable();
    t.string('slug', 255);
    t.text('description');
    // SEO translations
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 500);
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    
    t.index('productCategoryId');
    t.index('localeId');
    t.index('slug');
    t.unique(['productCategoryId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('categoryTranslation');
};
