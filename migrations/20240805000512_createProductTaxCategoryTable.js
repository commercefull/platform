exports.up = function(knex) {
  return knex.schema.createTable('productTaxCategory', t => {
    t.uuid('productTaxCategoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').notNullable().references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('taxCategoryId').notNullable().references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('overrideStoreSettings').notNullable().defaultTo(false);
    t.text('notes');

    t.index('productId');
    t.index('productVariantId');
    t.index('taxCategoryId');
    t.index('merchantId');
    t.index('isDefault');
    t.index('overrideStoreSettings');
    t.unique(['productId', 'productVariantId', 'taxCategoryId']);
    t.unique(['productId', 'taxCategoryId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTaxCategory');
};
