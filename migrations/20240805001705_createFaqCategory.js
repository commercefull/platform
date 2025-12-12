/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('faqCategory', function(table) {
    table.uuid('faqCategoryId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('parentCategoryId').references('faqCategoryId').inTable('faqCategory').onDelete('SET NULL');
    table.string('name').notNullable();
    table.string('slug').unique();
    table.text('description');
    table.string('icon');
    table.string('color');
    table.string('imageUrl');
    table.integer('sortOrder').defaultTo(0);
    table.integer('articleCount').defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.boolean('isFeatured').defaultTo(false);
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('slug');
    table.index('isActive');
    table.index('sortOrder');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('faqCategory');
};
