/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationPreference', t => {
    t.uuid('notificationPreferenceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId').notNullable();
    t.enu('userType', ['customer', 'merchant', 'admin'], { useNative: true, enumName: 'notification_user_type' }).notNullable().defaultTo('customer');
    t.specificType('type', 'notification_type').notNullable();
    t.jsonb('channelPreferences').notNullable().defaultTo('{}');
    t.boolean('isEnabled').notNullable().defaultTo(true);
    t.jsonb('schedulePreferences');
    
    t.unique(['userId', 'userType', 'type']);
    t.index('isEnabled');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationPreference');
};
