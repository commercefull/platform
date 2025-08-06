exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "productStatus" AS ENUM (
      'draft',
      'pending_review',
      'active',
      'inactive',
      'discontinued',
      'archived'
    );
    CREATE TYPE "productVisibility" AS ENUM (
      'visible',
      'hidden',
      'catalog_only',
      'search_only',
      'featured'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "productStatus";
    DROP TYPE IF EXISTS "productVisibility";
  `);
};
