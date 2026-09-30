exports.up = function (knex) {
  // Unscoped orders (order lines without an organization) are recorded as
  // 'skipped' in the dedupe ledger — they legitimately have no org.
  return knex.raw('ALTER TABLE "recommendationProcessedOrder" ALTER COLUMN "organizationId" DROP NOT NULL');
};

exports.down = function (knex) {
  return knex.raw('ALTER TABLE "recommendationProcessedOrder" ALTER COLUMN "organizationId" SET NOT NULL');
};
