exports.up = function(knex) {
  return knex.schema.createTable('cartPromotionItem', t => {
    t.uuid('cartPromotionItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('cartPromotionId').notNullable().references('cartPromotionId').inTable('cartPromotion').onDelete('CASCADE');
    t.uuid('basketItemId').notNullable().references('basketItemId').inTable('basketItem').onDelete('CASCADE');
    t.decimal('discountAmount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.decimal('discountPercentage', 5, 2);
    t.decimal('originalPrice', 15, 2).notNullable();
    t.decimal('finalPrice', 15, 2).notNullable();
    

    t.index('cartPromotionId');
    t.index('basketItemId');
    t.unique(['cartPromotionId', 'basketItemId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cartPromotionItem');
};
