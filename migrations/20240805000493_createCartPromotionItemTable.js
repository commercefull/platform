exports.up = function(knex) {
  return knex.schema.createTable('cartPromotionItem', t => {
    t.uuid('cartPromotionItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('cartPromotionId').notNullable().references('cartPromotionId').inTable('cart_promotion').onDelete('CASCADE');
    t.uuid('cartItemId').notNullable().references('cartItemId').inTable('basket_item').onDelete('CASCADE');
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.decimal('discountPercentage', 5, 2);
    t.decimal('originalPrice', 15, 2).notNullable();
    t.decimal('finalPrice', 15, 2).notNullable();
    

    t.index('cartPromotionId');
    t.index('cartItemId');
    t.unique(['cartPromotionId', 'cartItemId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cartPromotionItem');
};
