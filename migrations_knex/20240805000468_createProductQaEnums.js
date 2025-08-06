exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "qaStatus" AS ENUM (
      'pending',
      'published',
      'rejected',
      'answered'
    );
    CREATE TYPE "answerStatus" AS ENUM (
      'pending',
      'published',
      'rejected'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "qaStatus";
    DROP TYPE IF EXISTS "answerStatus";
  `);
};
