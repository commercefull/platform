exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "tax_exemption_status" AS ENUM (
      'pending',
      'active',
      'expired',
      'revoked',
      'rejected'
    );
    CREATE TYPE "tax_exemption_type" AS ENUM (
      'business',
      'government',
      'nonprofit',
      'educational',
      'reseller',
      'diplomatic',
      'other'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "tax_exemption_status";
    DROP TYPE IF EXISTS "tax_exemption_type";
  `);
};
