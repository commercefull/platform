exports.up = function(knex) {
  return knex.schema.createTable('taxCalculationLine', t => {
    t.uuid('taxCalculationLineId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('calculationId').notNullable().references('taxCalculationId').inTable('taxCalculation').onDelete('CASCADE');
    t.uuid('lineItemId');
    t.string('lineItemType', 50).notNullable();
    t.uuid('productId').references('productId').inTable('product');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant');
    t.string('sku', 255);
    t.string('name', 255).notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('unitPrice', 15, 2).notNullable();
    t.decimal('lineTotal', 15, 2).notNullable();
    t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxableAmount', 15, 2).notNullable();
    t.decimal('taxExemptAmount', 15, 2).notNullable().defaultTo(0);
    t.uuid('taxCategoryId').references('taxCategoryId').inTable('taxCategory');
    t.string('taxCategoryCode', 50);

    t.index('calculationId');
    t.index('lineItemId');
    t.index('lineItemType');
    t.index('productId');
    t.index('productVariantId');
    t.index('taxCategoryId');
    t.index('sku');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxCalculationLine');
};
