exports.up = function(knex) {
  return knex.schema.createTable('cart_promotion_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('cartPromotionId').notNullable().references('id').inTable('cart_promotion').onDelete('CASCADE');
    t.uuid('cartItemId').notNullable().references('id').inTable('basket_item').onDelete('CASCADE');
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.decimal('discountPercentage', 5, 2);
    t.decimal('originalPrice', 15, 2).notNullable();
    t.decimal('finalPrice', 15, 2).notNullable();
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('cartPromotionId');
    t.index('cartItemId');
    t.unique(['cartPromotionId', 'cartItemId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cart_promotion_item');
};
