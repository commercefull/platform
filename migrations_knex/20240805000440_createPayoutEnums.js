exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "payoutStatus" AS ENUM (
      'pending',
      'processing',
      'paid',
      'failed',
      'cancelled'
    );
    CREATE TYPE "payoutFrequency" AS ENUM (
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'manual'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE IF EXISTS "payoutStatus";
    DROP TYPE IF EXISTS "payoutFrequency";
  `);
};
