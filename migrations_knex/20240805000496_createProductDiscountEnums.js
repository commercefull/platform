exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "productDiscountAppliesTo" AS ENUM (
      'specific_products',
      'specific_categories',
      'specific_brands',
      'all_products'
    );
    CREATE TYPE "productDiscountItemType" AS ENUM (
      'product',
      'variant',
      'category',
      'brand'
    );
    CREATE TYPE "buyXGetYGetType" AS ENUM (
      'same_product',
      'specific_product',
      'cheapest',
      'most_expensive',
      'any'
    );
    CREATE TYPE "productTieredPriceDiscountType" AS ENUM (
      'fixed_price',
      'percentage',
      'fixed_amount'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "productDiscountAppliesTo";
    DROP TYPE IF EXISTS "productDiscountItemType";
    DROP TYPE IF EXISTS "buyXGetYGetType";
    DROP TYPE IF EXISTS "productTieredPriceDiscountType";
  `);
};
