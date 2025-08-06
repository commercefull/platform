/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productToTag', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('tagId').notNullable().references('id').inTable('productTag').onDelete('CASCADE');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.index('productId');
    t.index('tagId');
    t.unique(['productId', 'tagId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productToTag');
};
