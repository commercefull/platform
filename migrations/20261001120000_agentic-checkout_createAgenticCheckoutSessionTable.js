/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('agenticCheckoutSession');
  if (hasTable) return;

  await knex.schema.createTable('agenticCheckoutSession', t => {
    t.uuid('agenticCheckoutSessionId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('integrationId').notNullable().references('integrationId').inTable('integration').onDelete('CASCADE');
    t.uuid('organizationId').notNullable().references('organizationId').inTable('organization').onDelete('CASCADE');
    t.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('basketId').nullable().references('basketId').inTable('basket').onDelete('SET NULL');
    t.uuid('checkoutId').nullable().references('checkoutSessionId').inTable('checkoutSession').onDelete('SET NULL');
    t.uuid('orderId').nullable().references('orderId').inTable('order').onDelete('SET NULL');
    t.string('status', 32).notNullable().defaultTo('active');
    t.jsonb('buyer').nullable();
    t.jsonb('fulfillmentDetails').nullable();
    t.jsonb('attribution').nullable();
    t.jsonb('metadata').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiresAt').notNullable();

    t.index(['integrationId', 'status']);
    t.index('checkoutId');
    t.index('expiresAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('agenticCheckoutSession');
};
