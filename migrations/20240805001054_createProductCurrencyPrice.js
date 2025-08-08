/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productCurrencyPrice', t => {
    t.uuid('productCurrencyPriceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.uuid('currencyId').notNullable().references('currencyId').inTable('currency');
    t.decimal('price', 15, 4).notNullable();
    t.decimal('compareAtPrice', 15, 4);
    t.boolean('isManual').notNullable().defaultTo(true);
    t.uuid('updatedBy');
    t.index('productId');
    t.index('productVariantId');
    t.index('currencyId');
    t.unique(['productId', 'productVariantId', 'currencyId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productCurrencyPrice');
};
