/**
 * paymentGateway.provider is an open identifier set (PSPRoute domain uses
 * klarna/affirm/etc.); the enum CHECK artificially rejects valid providers.
 */
exports.up = function (knex) {
  return knex.schema.raw('ALTER TABLE "paymentGateway" DROP CONSTRAINT IF EXISTS "paymentGateway_provider_check"');
};

exports.down = function (knex) {
  return knex.schema.raw(
    `ALTER TABLE "paymentGateway" ADD CONSTRAINT "paymentGateway_provider_check" CHECK ("provider" = ANY (ARRAY['stripe'::text, 'square'::text, 'paypal'::text, 'manual'::text, 'other'::text]))`,
  );
};
