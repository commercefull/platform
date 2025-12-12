/**
 * Attribute Translation Table
 * Stores multi-language translations for product attributes and their options
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('attributeTranslation', t => {
    t.uuid('attributeTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productAttributeId').notNullable().references('productAttributeId').inTable('productAttribute').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('name', 255).notNullable(); // Attribute name (e.g., "Color", "Size")
    t.text('description');
    // Placeholder/help text
    t.string('placeholder', 255);
    t.text('helpText');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    
    t.index('productAttributeId');
    t.index('localeId');
    t.unique(['productAttributeId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('attributeTranslation');
};
