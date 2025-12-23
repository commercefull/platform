exports.up = function (knex) {
  return knex.schema.createTable('customerPrice', t => {
    t.uuid('customerPriceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('priceListId').notNullable().references('priceListId').inTable('priceList').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.enum('adjustmentType', ['percentage', 'fixed']).notNullable();
    t.decimal('adjustmentValue', 10, 2).notNullable();
    t.integer('priority').defaultTo(0);

    t.index(['priceListId', 'productId', 'productVariantId']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('customerPrice');
};
