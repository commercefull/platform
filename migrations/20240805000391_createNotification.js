/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notification', t => {
    t.uuid('notificationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('type', 50).notNullable(); // e.g., 'email', 'sms', 'push'
    t.string('recipient', 255).notNullable();
    t.string('subject', 255);
    t.text('body');
    t.jsonb('data');
    t.enum('status', ['pending', 'sent', 'failed', 'delivered', 'read']).notNullable().defaultTo('pending');
    t.timestamp('scheduledAt');
    t.timestamp('sentAt');
    t.timestamp('readAt');
    t.uuid('templateId');
    t.uuid('categoryId');
    t.timestamp('deletedAt');

    t.index('type');
    t.index('status');
    t.index('recipient');
    t.index('scheduledAt');
    t.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notification').then(() => {
    return knex.raw('DROP TYPE IF EXISTS notification_status');
  });
};
