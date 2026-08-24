export async function up(knex) {
  await knex.schema.createTable('ccpaDsr', (table) => {
    table.string('ccpaDsrId').primary();
    table.string('customerId').notNullable().index();
    table.string('organizationId').notNullable().index();
    table.enum('requestType', ['know', 'delete', 'optOutSale', 'optOutShare', 'limitUse', 'correct']).notNullable();
    table.enum('status', ['pending', 'verified', 'processing', 'completed', 'rejected', 'cancelled']).notNullable().defaultTo('pending');
    table.enum('source', ['web', 'email', 'phone', 'toll_free_number', 'authorizedAgent']).notNullable();
    table.string('reason');
    table.boolean('identityVerified').notNullable().defaultTo(false);
    table.string('verificationMethod');
    table.timestamp('verifiedAt');
    table.string('authorizedAgent');
    table.timestamp('requestedAt').notNullable();
    table.timestamp('deadlineAt').notNullable().index();
    table.boolean('extensionRequested').notNullable().defaultTo(false);
    table.string('extensionReason');
    table.timestamp('extendedDeadlineAt');
    table.timestamp('completedAt');
    table.string('processedBy');
    table.string('adminNotes');
    table.string('rejectionReason');
    table.jsonb('dataCategoriesRequested');
    table.string('downloadUrl');
    table.timestamp('downloadExpiresAt');
    table.string('ipAddress');
    table.string('userAgent');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ccpaDsr');
}
