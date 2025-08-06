exports.up = function(knex) {
  return knex.schema.createTable('category_promotion_product', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('categoryPromotionId').notNullable().references('id').inTable('category_promotion').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.integer('displayOrder').notNullable().defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('categoryPromotionId');
    t.index('productId');
    t.index('isFeatured');
    t.index('displayOrder');
    t.unique(['categoryPromotionId', 'productId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('category_promotion_product');
};
