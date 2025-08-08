exports.up = function(knex) {
  return knex.schema.createTable('productTaxCategory', t => {
    t.uuid('productTaxCategoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('taxCategoryId').notNullable().references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('overrideStoreSettings').notNullable().defaultTo(false);
    t.text('notes');

    t.index('productId');
    t.index('productVariantId');
    t.index('taxCategoryId');
    t.index('merchantId');
    t.index('isDefault');
    t.index('overrideStoreSettings');
    t.unique(['productId', 'productVariantId', 'taxCategoryId'], 'productTaxCategoryVariantUnique').whereNotNull('productVariantId');
    t.unique(['productId', 'taxCategoryId'], 'productTaxCategoryUnique').whereNull('productVariantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTaxCategory');
};
