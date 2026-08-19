/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationTemplate', t => {
    t.uuid('notificationTemplateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 100).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.text('type').notNullable();
    t.jsonb('supportedChannels').notNullable();
    t.enum('defaultChannel', ['email', 'sms', 'push', 'in_app']).notNullable();
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
    t.index(['supportedChannels'], 'notificationTemplate_supportedChannels_index', 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationTemplate');
};
