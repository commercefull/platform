exports.up = function(knex) {
  return knex.schema.createTable('customer_price', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('priceListId').notNullable().references('id').inTable('price_list').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.enu('adjustmentType', null, { useNative: true, existingType: true, enumName: 'pricing_adjustment_type' }).notNullable();
    t.decimal('adjustmentValue', 10, 2).notNullable();
    t.integer('priority').defaultTo(0);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['priceListId', 'productId', 'variantId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_price');
};
