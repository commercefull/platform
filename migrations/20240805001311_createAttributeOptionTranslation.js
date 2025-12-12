/**
 * Attribute Option Translation Table
 * Stores multi-language translations for product attribute options (e.g., "Red", "Large")
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('attributeOptionTranslation', t => {
    t.uuid('attributeOptionTranslationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productAttributeOptionId').notNullable().references('productAttributeOptionId').inTable('productAttributeOption').onDelete('CASCADE');
    t.uuid('localeId').notNullable().references('localeId').inTable('locale').onDelete('CASCADE');
    // Translatable content
    t.string('label', 255).notNullable(); // Display label (e.g., "Red", "Rojo", "Rouge")
    t.text('description');
    // Translation metadata
    t.boolean('isAutoTranslated').notNullable().defaultTo(false);
    t.string('translationSource', 50);
    t.boolean('isApproved').notNullable().defaultTo(false);
    
    t.index('productAttributeOptionId');
    t.index('localeId');
    t.unique(['productAttributeOptionId', 'localeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('attributeOptionTranslation');
};
