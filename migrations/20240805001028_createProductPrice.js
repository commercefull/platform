/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productPrice', t => {
    t.uuid('productPriceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('priceListId').notNullable().references('priceListId').inTable('priceList').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.decimal('price', 15, 2).notNullable();
    t.decimal('salePrice', 15, 2);
    t.integer('minQuantity').defaultTo(1);
    t.integer('maxQuantity');
    t.timestamp('validFrom');
    t.timestamp('validTo');

    t.uuid('createdBy');
    t.index('priceListId');
    t.index('productId');
    t.index('productVariantId');
    t.index('price');
    t.index('salePrice');
    t.index('minQuantity');
    t.index('maxQuantity');
    t.index('validFrom');
    t.index('validTo');
    t.unique(['priceListId', 'productId', 'productVariantId', 'minQuantity'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productPrice');
};
