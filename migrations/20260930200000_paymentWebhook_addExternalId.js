/**
 * Add paymentWebhook.externalId — the provider-side event id used for
 * idempotent webhook dedup in ProcessPaymentWebhook (findWebhookByExternalId).
 * The column was referenced by code but never created, so every dedup check
 * failed with 42703 and duplicate gateway events re-ran side effects.
 *
 * organizationId is relaxed to nullable: provider-level webhooks are ingested
 * before the owning organization/transaction is resolved.
 */
exports.up = function (knex) {
  return knex.schema.alterTable('paymentWebhook', t => {
    t.string('externalId', 191);
    t.uuid('organizationId').nullable().alter();
  }).then(() =>
    knex.schema.alterTable('paymentWebhook', t => {
      t.unique('externalId');
    }),
  );
};

exports.down = function (knex) {
  return knex.schema.alterTable('paymentWebhook', t => {
    t.dropUnique('externalId');
    t.dropColumn('externalId');
    t.uuid('organizationId').notNullable().alter();
  });
};
