/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE "checkoutSession" DROP CONSTRAINT IF EXISTS "checkoutSession_status_check";
    ALTER TABLE "checkoutSession" ADD CONSTRAINT "checkoutSession_status_check"
      CHECK (status = ANY (ARRAY['active'::text, 'pending_payment'::text, 'processing'::text, 'completed'::text, 'abandoned'::text, 'expired'::text, 'failed'::text]));
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE "checkoutSession" DROP CONSTRAINT IF EXISTS "checkoutSession_status_check";
    ALTER TABLE "checkoutSession" ADD CONSTRAINT "checkoutSession_status_check"
      CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text, 'expired'::text]));
  `);
};
