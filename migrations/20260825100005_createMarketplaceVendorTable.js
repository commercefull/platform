export async function up(knex) {
  await knex.schema.createTable('marketplaceVendor', (table) => {
    table.uuid('vendorId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.string('legalName');
    table.string('taxId');
    table.string('email').notNullable();
    table.string('phone');
    table.string('website');
    table.string('logoUrl');
    table.text('description');
    table.string('status').notNullable().defaultTo('pending');
    table.string('tier').notNullable().defaultTo('standard');
    table.decimal('commissionRate', 5, 2).notNullable().defaultTo(10);
    table.jsonb('address');
    table.jsonb('bankInfo');
    table.jsonb('stats').notNullable().defaultTo('{}');
    table.timestamp('approvedAt');
    table.timestamp('suspendedAt');
    table.timestamp('terminatedAt');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.unique(['email', 'organizationId']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('marketplaceVendor');
}
