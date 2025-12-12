/**
 * Brand Translation Table
 * Stores multi-language translations for product brands
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('brandTranslation', t => {
    t.uuid('brandTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productBrandId').notNullable().references('productBrandId').inTable('productBrand').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('name', 255); // Some brands keep same name, some translate
    t.string('slug', 255);
    t.text('description');
    t.text('story'); // Brand story/history
    // SEO translations
    t.string('metaTitle', 255);
    t.text('metaDescription');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    
    t.index('productBrandId');
    t.index('localeId');
    t.index('slug');
    t.unique(['productBrandId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('brandTranslation');
};
