export async function up(knex) {
  await knex.schema.createTable('keyRotationPolicy', (table) => {
    table.string('keyRotationPolicyId').primary();
    table.string('organizationId').notNullable().index();
    table.enum('keyType', ['paymentWebhookSecret', 'paymentApiKey', 'jwtSigningKey', 'hmacSigningKey', 'encryptionKey']).notNullable();
    table.string('keyIdentifier').notNullable();
    table.integer('rotationIntervalDays').notNullable();
    table.timestamp('lastRotatedAt').notNullable();
    table.timestamp('nextRotationAt').notNullable().index();
    table.enum('status', ['active', 'rotating', 'retired', 'expired']).notNullable().defaultTo('active');
    table.string('previousKeyId');
    table.integer('rotationCount').notNullable().defaultTo(0);
    table.integer('gracePeriodDays').notNullable().defaultTo(7);
    table.integer('notifyBeforeDays').notNullable().defaultTo(14);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.unique(['organizationId', 'keyIdentifier']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('keyRotationPolicy');
}
