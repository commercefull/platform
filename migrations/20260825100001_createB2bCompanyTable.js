export async function up(knex) {
  await knex.schema.createTable('b2bCompany', (table) => {
    table.uuid('companyId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.string('legalName');
    table.string('taxId');
    table.string('status').notNullable().defaultTo('pending');
    table.string('paymentTerms').notNullable().defaultTo('net30');
    table.decimal('creditLimit', 14, 2);
    table.decimal('outstandingBalance', 14, 2).notNullable().defaultTo(0);
    table.jsonb('billingAddress');
    table.jsonb('shippingAddress');
    table.string('contactEmail');
    table.string('contactPhone');
    table.string('website');
    table.uuid('parentId').references('companyId').inTable('b2bCompany').onDelete('SET NULL');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('b2bCompany');
}
