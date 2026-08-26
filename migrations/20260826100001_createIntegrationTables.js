/**
 * Create integration tables: integration, integrationCredential,
 * integrationSubscription, integrationLog
 */

export function up(knex) {
  return knex.schema
    .createTable('integration', (table) => {
      table.string('integrationId').primary();
      table.string('organizationId').notNullable();
      table.string('name').notNullable();
      table.string('provider').notNullable();
      table.string('status').notNullable().defaultTo('pending');
      table.text('description').nullable();
      table.string('webhookUrl').nullable();
      table.jsonb('config').notNullable().defaultTo('{}');
      table.timestamp('lastSyncAt').nullable();
      table.text('lastError').nullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      table.index(['organizationId']);
      table.index(['provider']);
      table.index(['status']);
    })
    .createTable('integrationCredential', (table) => {
      table.string('credentialId').primary();
      table.string('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('label').notNullable();
      table.text('encryptedData').notNullable();
      table.string('iv').notNullable();
      table.string('authTag').notNullable();
      table.timestamp('expiresAt').nullable();
      table.boolean('isActive').notNullable().defaultTo(true);
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      table.index(['integrationId']);
      table.index(['integrationId', 'isActive']);
    })
    .createTable('integrationSubscription', (table) => {
      table.string('subscriptionId').primary();
      table.string('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
      table.string('eventType').notNullable();
      table.string('targetAction').notNullable();
      table.text('description').nullable();
      table.jsonb('payloadMapping').notNullable().defaultTo('{}');
      table.jsonb('headers').nullable();
      table.boolean('isActive').notNullable().defaultTo(true);
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

      table.index(['integrationId']);
      table.index(['eventType']);
      table.index(['isActive']);
    })
    .createTable('integrationLog', (table) => {
      table.string('logId').primary();
      table.string('integrationId').notNullable().references('integration.integrationId').onDelete('CASCADE');
      table.string('subscriptionId').nullable();
      table.string('eventType').notNullable();
      table.string('targetAction').notNullable();
      table.string('status').notNullable().defaultTo('pending');
      table.jsonb('requestPayload').nullable();
      table.integer('responseStatus').nullable();
      table.text('responseBody').nullable();
      table.text('errorMessage').nullable();
      table.integer('durationMs').nullable();
      table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

      table.index(['integrationId']);
      table.index(['subscriptionId']);
      table.index(['status']);
      table.index(['createdAt']);
    });
}

export function down(knex) {
  return knex.schema
    .dropTableIfExists('integrationLog')
    .dropTableIfExists('integrationSubscription')
    .dropTableIfExists('integrationCredential')
    .dropTableIfExists('integration');
}
