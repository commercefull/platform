exports.up = function(knex) {
  return knex.schema.createTable('notificationBatch', t => {
    t.uuid('notificationBatchId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.enum('type', ['orderStatus', 'promotion', 'accountAlert']).notNullable();
    t.uuid('templateId').references('notificationTemplateId').inTable('notificationTemplate');
    t.enum('channel', ['email', 'sms', 'inApp', 'push']).notNullable();
    t.string('status', 20).notNullable().defaultTo('draft').checkIn(['draft', 'scheduled', 'inProgress', 'completed', 'cancelled', 'failed']);
    t.timestamp('scheduledAt');
    t.timestamp('startedAt');
    t.timestamp('completedAt');
    t.integer('targetCount').defaultTo(0);
    t.integer('sentCount').defaultTo(0);
    t.integer('deliveredCount').defaultTo(0);
    t.integer('failedCount').defaultTo(0);
    t.jsonb('targetAudience');
    t.jsonb('contentData');
    t.jsonb('sendingSettings');
    t.jsonb('testRecipients');
    

    t.index('type');
    t.index('templateId');
    t.index('channel');
    t.index('status');
    t.index('scheduledAt');
    t.index('startedAt');
    t.index('completedAt');
    t.index('createdAt');
    t.index('createdBy');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notificationBatch');
};
