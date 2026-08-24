export async function up(knex) {
  await knex.schema.createTable('b2bUser', (table) => {
    table.uuid('userId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('companyId').notNullable().references('companyId').inTable('b2bCompany').onDelete('CASCADE').index();
    table.uuid('organizationId').notNullable().index();
    table.string('email').notNullable();
    table.string('firstName');
    table.string('lastName');
    table.string('role').notNullable().defaultTo('buyer');
    table.string('status').notNullable().defaultTo('invited');
    table.jsonb('spendingLimits').notNullable().defaultTo('{}');
    table.string('department');
    table.string('costCenter');
    table.timestamp('invitedAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('activatedAt');
    table.timestamp('lastLoginAt');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.unique(['email', 'companyId']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('b2bUser');
}
