/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationDevice', t => {
    t.uuid('notificationDeviceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId').notNullable();
    t.specificType('userType', 'notification_user_type').notNullable().defaultTo('customer');
    t.text('deviceToken').notNullable();
    t.enu('deviceType', ['ios', 'android', 'web', 'desktop', 'other'], { useNative: true, enumName: 'notification_device_type' }).notNullable();
    t.string('deviceName', 100);
    t.string('deviceModel', 100);
    t.string('appVersion', 20);
    t.string('osVersion', 20);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('lastUsedAt').notNullable().defaultTo(knex.fn.now());
    t.jsonb('metadata');
    t.index('userId');
    t.index('userType');
    t.index('deviceToken');
    t.index('deviceType');
    t.index('isActive');
    t.index('lastUsedAt');
    t.unique(['userId', 'deviceToken']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationDevice')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS notification_device_type'));
};
