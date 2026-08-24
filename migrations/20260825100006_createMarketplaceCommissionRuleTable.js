export async function up(knex) {
  await knex.schema.createTable('marketplaceCommissionRule', (table) => {
    table.uuid('ruleId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.string('scope').notNullable();
    table.decimal('rate', 5, 2).notNullable().defaultTo(0);
    table.decimal('fixedAmount', 14, 2);
    table.jsonb('tiers');
    table.uuid('categoryId');
    table.uuid('vendorId').references('vendorId').inTable('marketplaceVendor').onDelete('CASCADE');
    table.uuid('productId');
    table.integer('priority').notNullable().defaultTo(0);
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamp('startsAt');
    table.timestamp('endsAt');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('marketplaceCommissionRule');
}
