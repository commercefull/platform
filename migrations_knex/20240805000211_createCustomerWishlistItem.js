/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerWishlistItem', t => {
    t.uuid('customerWishlistItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerWishlistId').notNullable().references('customerWishlistId').inTable('customerWishlist').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('variantId').inTable('product_variant').onDelete('CASCADE');
    t.integer('quantity').notNullable().defaultTo(1);
    t.text('note');
    t.integer('priority').defaultTo(0);
    t.jsonb('additionalData');
    t.index('customerWishlistId');
    t.index('productId');
    t.index('variantId');
    t.index('priority');
    t.unique(['customerWishlistId', 'productId', 'variantId'], { nulls: 'not distinct' });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerWishlistItem');
};
