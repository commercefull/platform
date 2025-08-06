exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "tax_calculation_method" AS ENUM (
      'unit_based',
      'row_based',
      'total_based'
    );
    CREATE TYPE "tax_rate_type" AS ENUM (
      'percentage',
      'fixed_amount',
      'compound',
      'combined'
    );
    CREATE TYPE "tax_rule_condition_type" AS ENUM (
      'customer_group',
      'product_attribute',
      'minimum_amount',
      'time_period',
      'day_of_week',
      'shipping_method',
      'payment_method'
    );
    CREATE TYPE "tax_based_on_type" AS ENUM (
      'shipping_address',
      'billing_address',
      'store_address',
      'origin_address'
    );
    CREATE TYPE "tax_display_totals_type" AS ENUM (
      'itemized',
      'combined',
      'none'
    );
    CREATE TYPE "tax_provider_type" AS ENUM (
      'internal',
      'avalara',
      'taxjar',
      'external'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "tax_calculation_method";
    DROP TYPE IF EXISTS "tax_rate_type";
    DROP TYPE IF EXISTS "tax_rule_condition_type";
    DROP TYPE IF EXISTS "tax_based_on_type";
    DROP TYPE IF EXISTS "tax_display_totals_type";
    DROP TYPE IF EXISTS "tax_provider_type";
  `);
};
