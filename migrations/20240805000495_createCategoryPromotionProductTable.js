exports.up = function(knex) {
  return knex.schema.createTable('categoryPromotionProduct', t => {
    t.uuid('categoryPromotionProductId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('categoryPromotionId').notNullable().references('categoryPromotionId').inTable('category_promotion').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.integer('displayOrder').notNullable().defaultTo(0);
    

    t.index('categoryPromotionId');
    t.index('productId');
    t.index('isFeatured');
    t.index('displayOrder');
    t.unique(['categoryPromotionId', 'productId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categoryPromotionProduct');
};
