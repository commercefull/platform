exports.up = function(knex) {
  return knex.schema.createTable('buy_x_get_y_discount', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('discountId').notNullable().references('id').inTable('productDiscount').onDelete('CASCADE').unique();
    t.integer('buyQuantity').notNullable().defaultTo(1);
    t.integer('getQuantity').notNullable().defaultTo(1);
    t.enum('getType', ['same_product', 'different_product']).notNullable().defaultTo('same_product');
    t.uuid('getProductId').references('id').inTable('product');
    t.uuid('getVariantId').references('id').inTable('productVariant');
    t.uuid('getCategoryId').references('id').inTable('productCategory');
    t.decimal('discountPercentage', 5, 2).notNullable().defaultTo(100.00);
    t.integer('maxFreeItems');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('discountId');
    t.index('getType');
    t.index('getProductId');
    t.index('getVariantId');
    t.index('getCategoryId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('buy_x_get_y_discount');
};
