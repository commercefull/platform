exports.up = function(knex) {
  return knex.schema.createTable('product_tax_category', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('taxCategoryId').notNullable().references('id').inTable('tax_category').onDelete('CASCADE');
    t.uuid('merchantId').references('id').inTable('merchant');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('overrideStoreSettings').notNullable().defaultTo(false);
    t.text('notes');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('productId');
    t.index('variantId');
    t.index('taxCategoryId');
    t.index('merchantId');
    t.index('isDefault');
    t.index('overrideStoreSettings');
    t.unique(['productId', 'variantId', 'taxCategoryId'], 'product_tax_category_variant_unique').whereNotNull('variantId');
    t.unique(['productId', 'taxCategoryId'], 'product_tax_category_unique').whereNull('variantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_tax_category');
};
