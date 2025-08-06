exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "tax_calculation_status" AS ENUM (
      'pending',
      'completed',
      'failed',
      'adjusted',
      'refunded'
    );
    CREATE TYPE "tax_transaction_source" AS ENUM (
      'order',
      'invoice',
      'refund',
      'adjustment',
      'manual',
      'estimate'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "tax_calculation_status";
    DROP TYPE IF EXISTS "tax_transaction_source";
  `);
};
