exports.up = function(knex) {
  return knex.schema.createTable('notificationDeliveryLog', t => {
    t.uuid('notificationDeliveryLogId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('notificationId').references('notificationId').inTable('notification').onDelete('SET NULL');
    t.uuid('userId').notNullable();
    t.string('userType', 20).notNullable().defaultTo('customer').checkIn(['customer', 'merchant', 'admin']);
    t.enu('type', ['orderStatus', 'promotion', 'accountAlert'], { useNative: true, enumName: 'notification_type' }).notNullable();
    t.enu('channel', ['email', 'sms', 'in_app', 'push'], { useNative: true, enumName: 'notification_channel' }).notNullable();
    t.string('recipient', 255).notNullable();
    t.string('status', 20).notNullable().defaultTo('pending').checkIn(['pending', 'sent', 'delivered', 'failed', 'bounced', 'blocked']);
    t.text('statusDetails');
    t.timestamp('sentAt');
    t.timestamp('deliveredAt');
    t.timestamp('failedAt');
    t.text('failureReason');
    t.string('provider', 50);
    t.string('providerMessageId', 255);
    t.jsonb('providerResponse');
    t.integer('retryCount').defaultTo(0);
    

    t.index('notificationId');
    t.index('userId');
    t.index('userType');
    t.index('type');
    t.index('channel');
    t.index('recipient');
    t.index('status');
    t.index('sentAt');
    t.index('deliveredAt');
    t.index('failedAt');
    t.index('provider');
    t.index('providerMessageId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notificationDeliveryLog');
};
