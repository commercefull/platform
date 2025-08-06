/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productToCategory', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('categoryId').notNullable().references('id').inTable('productCategory').onDelete('CASCADE');
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.integer('position').defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.index('productId');
    t.index('categoryId');
    t.index('isPrimary');
    t.index('position');
    t.unique(['productId', 'categoryId']);
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idxProductToCategoryPrimary ON productToCategory (productId, isPrimary) WHERE isPrimary = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productToCategory');
};
