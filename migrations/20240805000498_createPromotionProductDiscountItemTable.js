exports.up = function (knex) {
  return knex.schema.createTable('promotionProductDiscountItem', t => {
    t.uuid('promotionProductDiscountItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionProductDiscountId')
      .notNullable()
      .references('promotionProductDiscountId')
      .inTable('promotionProductDiscount')
      .onDelete('CASCADE');
    t.uuid('productId').references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.enum('itemType', ['product', 'variant', 'category']).notNullable();

    t.index('promotionProductDiscountId');
    t.index('productId');
    t.index('productVariantId');
    t.index('productCategoryId');
    t.index('itemType');

    t.unique(['promotionProductDiscountId', 'productId'], 'idx_promo_discount_product');
    t.unique(['promotionProductDiscountId', 'productVariantId'], 'idx_promo_discount_variant');
    t.unique(['promotionProductDiscountId', 'productCategoryId'], 'idx_promo_discount_category');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('promotionProductDiscountItem');
};
