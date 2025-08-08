exports.up = function(knex) {
  return knex.schema.createTable('notificationWebhook', t => {
    t.uuid('notificationWebhookId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('url').notNullable();
    t.text('secret');
    t.jsonb('events').notNullable();
    t.string('format', 20).notNullable().defaultTo('json').checkIn(['json', 'form', 'xml']);
    t.jsonb('headers');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('failureCount').defaultTo(0);
    t.timestamp('lastSuccess');
    t.timestamp('lastFailure');
    t.text('lastFailureReason');
    

    t.index('isActive');
    t.index('lastSuccess');
    t.index('lastFailure');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('notificationWebhook');
};
