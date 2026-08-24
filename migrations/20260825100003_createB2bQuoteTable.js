export async function up(knex) {
  await knex.schema.createTable('b2bQuote', (table) => {
    table.uuid('quoteId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('companyId').notNullable().references('companyId').inTable('b2bCompany').onDelete('CASCADE').index();
    table.uuid('organizationId').notNullable().index();
    table.string('quoteNumber').notNullable().unique();
    table.string('status').notNullable().defaultTo('draft');
    table.string('requestedBy').notNullable();
    table.jsonb('lineItems').notNullable().defaultTo('[]');
    table.decimal('subtotal', 14, 2).notNullable().defaultTo(0);
    table.decimal('discountTotal', 14, 2).notNullable().defaultTo(0);
    table.decimal('taxTotal', 14, 2).notNullable().defaultTo(0);
    table.decimal('total', 14, 2).notNullable().defaultTo(0);
    table.string('currency').notNullable().defaultTo('USD');
    table.text('notes');
    table.text('internalNotes');
    table.timestamp('validUntil').notNullable();
    table.timestamp('sentAt');
    table.timestamp('viewedAt');
    table.timestamp('acceptedAt');
    table.timestamp('rejectedAt');
    table.uuid('convertedOrderId');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('b2bQuote');
}
