/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('productPrice', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        t.uuid('priceListId').notNullable().references('id').inTable('priceList').onDelete('CASCADE');
        t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
        t.uuid('variantId').references('id').inTable('productVariant').onDelete('CASCADE');
    t.decimal('price', 15, 2).notNullable();
        t.decimal('salePrice', 15, 2);
        t.integer('minQuantity').defaultTo(1);
        t.integer('maxQuantity');
        t.timestamp('validFrom');
        t.timestamp('validTo');
    t.jsonb('metadata');
        t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        t.uuid('createdBy');
        t.index('priceListId');
        t.index('productId');
        t.index('variantId');
    t.index('price');
        t.index('salePrice');
        t.index('minQuantity');
        t.index('maxQuantity');
        t.index('validFrom');
        t.index('validTo');
        t.unique(['priceListId', 'productId', 'variantId', 'minQuantity'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('productPrice');
};
