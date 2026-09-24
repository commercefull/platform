/**
 * Create productBasePrice — the pricing module's canonical store for
 * catalog base prices (product-level and per-variant overrides).
 *
 * Monetary amounts are integer minor units (cents) — bigint columns.
 * `productVariantId` NULL marks the product-level row; one row per
 * (product, variant, currency) supports multi-currency base prices.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('productBasePrice', t => {
    t.uuid('productBasePriceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.string('currencyCode', 3).notNullable().references('code').inTable('currency');
    t.bigInteger('priceCents').notNullable();
    t.bigInteger('salePriceCents');
    t.bigInteger('compareAtPriceCents');
    t.bigInteger('costPriceCents');
    t.decimal('taxRate', 5, 2);

    t.index('productId');
    t.index('productVariantId');
    t.index('currencyCode');
    t.index('priceCents');
  });

  // NULLS NOT DISTINCT so a NULL productVariantId (product-level row)
  // participates in uniqueness — enables ON CONFLICT upserts.
  await knex.raw(`
    ALTER TABLE "productBasePrice"
      ADD CONSTRAINT "productbaseprice_productid_productvariantid_currencycode_unique"
      UNIQUE NULLS NOT DISTINCT ("productId", "productVariantId", "currencyCode")
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productBasePrice');
};
