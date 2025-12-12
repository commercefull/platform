/**
 * Product Translation Table
 * Stores multi-language translations for products
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productTranslation', t => {
    t.uuid('productTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('name', 255).notNullable();
    t.string('slug', 255);
    t.text('shortDescription');
    t.text('description');
    // SEO translations
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.string('metaKeywords', 500);
    // Additional translatable fields
    t.text('returnPolicy');
    t.text('warranty');
    t.text('careInstructions');
    t.text('ingredients'); // For food/cosmetics
    t.text('usageInstructions');
    // Custom translated fields
    t.jsonb('customFields');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50); // manual, google, deepl, ai
    t.decimal('translationQuality', 3, 2); // 0-1 confidence score
    t.timestamp('reviewedAt');
    t.uuid('reviewedBy');
    t.boolean('isApproved').notNullable().defaultTo(false);
    
    t.index('productId');
    t.index('localeId');
    t.index('slug');
    t.index('isApproved');
    t.unique(['productId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productTranslation');
};
