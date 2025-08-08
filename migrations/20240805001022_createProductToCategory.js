/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productToCategory', t => {
    t.uuid('productToCategoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('categoryId').notNullable().references('categoryId').inTable('productCategory').onDelete('CASCADE');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.integer('position').defaultTo(0);
    t.index('productId');
    t.index('categoryId');
    t.index('isPrimary');
    t.index('position');
    t.unique(['productId', 'categoryId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productToCategory');
};
