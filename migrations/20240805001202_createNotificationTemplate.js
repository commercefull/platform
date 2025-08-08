/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationTemplate', t => {
    t.uuid('notificationTemplateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 100).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.specificType('type', 'notification_type').notNullable();
    t.specificType('supportedChannels', 'notification_channel[]').notNullable();
    t.specificType('defaultChannel', 'notification_channel').notNullable();
    t.string('subject', 255);
    t.text('htmlTemplate');
    t.text('textTemplate');
    t.text('pushTemplate');
    t.text('smsTemplate');
    t.jsonb('parameters');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('categoryCode', 50);
    t.jsonb('previewData');
    
    t.uuid('createdBy');
    t.index('code');
    t.index('type');
    t.index('isActive');
    t.index('categoryCode');
    t.index('supportedChannels', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationTemplate');
};
