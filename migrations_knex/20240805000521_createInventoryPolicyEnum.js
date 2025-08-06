exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "inventory_policy" AS ENUM (
      'deny',
      'continue',
      'backorder'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "inventory_policy";
  `);
};
