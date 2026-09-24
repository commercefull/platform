export async function up(knex) {
  await knex.schema.createTable('marketplaceVendorPayout', table => {
    table.uuid('payoutId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('vendorId').notNullable().references('vendorId').inTable('marketplaceVendor').onDelete('CASCADE').index();
    table.uuid('organizationId').notNullable().index();
    table.string('payoutNumber').notNullable().unique();
    table.string('status').notNullable().defaultTo('pending');
    table.string('method').notNullable().defaultTo('bank_transfer');
    table.timestamp('periodStart').notNullable();
    table.timestamp('periodEnd').notNullable();
    table.jsonb('lineItems').notNullable().defaultTo('[]');
    table.bigInteger('grossAmountCents').notNullable().defaultTo(0);
    table.bigInteger('commissionAmountCents').notNullable().defaultTo(0);
    table.bigInteger('netAmountCents').notNullable().defaultTo(0);
    table.string('currency').notNullable().defaultTo('USD');
    table.string('transactionRef');
    table.text('failureReason');
    table.timestamp('processedAt');
    table.timestamp('completedAt');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('marketplaceVendorPayout');
}
