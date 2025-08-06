exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "reviewStatus" AS ENUM (
      'pending',
      'approved',
      'rejected',
      'spam'
    );
    CREATE TYPE "reviewMediaType" AS ENUM (
      'image',
      'video'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "reviewStatus";
    DROP TYPE IF EXISTS "reviewMediaType";
  `);
};
