exports.up = function(knex) {
  return knex.schema.createTable('notificationEventLog', t => {
    t.uuid('notificationEventLogId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('notificationId').references('notificationId').inTable('notification').onDelete('SET NULL');
    t.uuid('deliveryLogId').references('notificationDeliveryLogId').inTable('notificationDeliveryLog').onDelete('SET NULL');
    t.uuid('userId');
    t.string('userType', 20);
    t.string('eventType', 50).notNullable().checkIn(['open', 'click', 'bounce', 'complaint', 'unsubscribe', 'block', 'dropped', 'impression', 'deferred']);
    t.jsonb('eventData');
    t.text('userAgent');
    t.string('ipAddress', 45);
    t.jsonb('deviceInfo');
    t.index('notificationId');
    t.index('deliveryLogId');
    t.index('userId');
    t.index('userType');
    t.index('eventType');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notificationEventLog');
};
