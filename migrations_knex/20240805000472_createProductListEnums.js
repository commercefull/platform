exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "productListType" AS ENUM (
      'wishlist',
      'favorites',
      'save_for_later',
      'custom'
    );
    CREATE TYPE "priorityType" AS ENUM (
      'low',
      'medium',
      'high'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "productListType";
    DROP TYPE IF EXISTS "priorityType";
  `);
};
