exports.up = function(knex) {
  return knex.schema.createTable('productDiscountItem', t => {
    t.uuid('productDiscountItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('discountId').notNullable().references('productDiscountId').inTable('productDiscount').onDelete('CASCADE');
    t.uuid('productId').references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('productCategoryId').notNullable().references('productCategoryId').inTable('productCategory').onDelete('CASCADE');
    t.uuid('productBrandId').references('productBrandId').inTable('productBrand').onDelete('CASCADE');
    t.enum('itemType', ['product', 'variant', 'category', 'brand']).notNullable();

    t.index('discountId');
    t.index('productId');
    t.index('productVariantId');
    t.index('productCategoryId');
    t.index('productBrandId');
    t.index('itemType');

    t.unique(['discountId', 'productId'], 'idx_discount_product');
    t.unique(['discountId', 'productVariantId'], 'idx_discount_variant');
    t.unique(['discountId', 'productCategoryId'], 'idx_discount_category');
    t.unique(['discountId', 'productBrandId'], 'idx_discount_brand');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productDiscountItem');
};
