exports.up = function(knex) {
  return knex.schema.createTable('promotionBuyXGetYDiscount', t => {
    t.uuid('promotionBuyXGetYDiscountId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionProductDiscountId').notNullable().references('promotionProductDiscountId').inTable('promotionProductDiscount').onDelete('CASCADE').unique();
    t.integer('buyQuantity').notNullable().defaultTo(1);
    t.integer('getQuantity').notNullable().defaultTo(1);
    t.enum('getType', ['sameProduct', 'differentProduct']).notNullable().defaultTo('sameProduct');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').notNullable().references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.decimal('discountPercentage', 5, 2).notNullable().defaultTo(100.00);
    t.integer('maxFreeItems');
    

    t.index('promotionProductDiscountId');
    t.index('getType');
    t.index('productId');
    t.index('productVariantId');
    t.index('productCategoryId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionBuyXGetYDiscount');
};
