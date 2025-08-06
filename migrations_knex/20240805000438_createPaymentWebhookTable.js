exports.up = function(knex) {
  return knex.schema.createTable('paymentWebhook', t => {
    t.uuid('paymentWebhookId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('gatewayId').references('paymentGatewayId').inTable('paymentGateway').onDelete('CASCADE');
    t.enum('provider', ['stripe', 'square', 'paypal', 'manual', 'other']).notNullable();
    t.string('eventType', 100).notNullable();
    t.jsonb('payload').notNullable();
    t.jsonb('headers');
    t.specificType('ipAddress', 'inet');
    t.timestamp('processedAt');
    t.string('status', 20).notNullable().checkIn(['pending', 'processed', 'failed', 'ignored']).defaultTo('pending');
    t.text('error');
    t.string('relatedEntityType', 50);
    t.uuid('relatedEntityId');
    t.jsonb('metadata');

    t.index('merchantId');
    t.index('gatewayId');
    t.index('provider');
    t.index('eventType');
    t.index('status');
    t.index('relatedEntityType');
    t.index('relatedEntityId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentWebhook');
};
