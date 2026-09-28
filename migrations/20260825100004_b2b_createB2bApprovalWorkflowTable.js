export async function up(knex) {
  await knex.schema.createTable('b2bApprovalWorkflow', table => {
    table.uuid('workflowId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('companyId').notNullable().references('companyId').inTable('b2bCompany').onDelete('CASCADE').index();
    table.uuid('organizationId').notNullable().index();
    table.string('type').notNullable();
    table.string('referenceId').notNullable();
    table.string('referenceNumber').notNullable();
    table.string('requestedBy').notNullable();
    table.string('requestedByEmail').notNullable();
    table.string('status').notNullable().defaultTo('pending');
    table.bigInteger('amountCents').notNullable();
    table.string('currencyCode', 3).notNullable().defaultTo('USD').references('code').inTable('currency');
    table.jsonb('steps').notNullable().defaultTo('[]');
    table.integer('currentStep').notNullable().defaultTo(1);
    table.text('description');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completedAt');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('b2bApprovalWorkflow');
}
