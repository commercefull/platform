exports.up = function(knex) {
  return knex.schema.createTable('product_discount_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('discountId').notNullable().references('id').inTable('productDiscount').onDelete('CASCADE');
    t.uuid('productId').references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('productVariant').onDelete('CASCADE');
    t.uuid('categoryId').references('id').inTable('productCategory').onDelete('CASCADE');
    t.uuid('brandId').references('id').inTable('productBrand').onDelete('CASCADE');
    t.enum('itemType', ['product', 'variant', 'category', 'brand']).notNullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('discountId');
    t.index('productId');
    t.index('variantId');
    t.index('categoryId');
    t.index('brandId');
    t.index('itemType');
    t.index(['discountId', 'productId'], 'idx_discount_product', { 
      predicate: knex.raw('"productId" IS NOT NULL') 
    });
    t.index(['discountId', 'variantId'], 'idx_discount_variant', { 
      predicate: knex.raw('"variantId" IS NOT NULL') 
    });
    t.index(['discountId', 'categoryId'], 'idx_discount_category', { 
      predicate: knex.raw('"categoryId" IS NOT NULL') 
    });
    t.index(['discountId', 'brandId'], 'idx_discount_brand', { 
      predicate: knex.raw('"brandId" IS NOT NULL') 
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_discount_item');
};
