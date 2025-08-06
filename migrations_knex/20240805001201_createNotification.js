/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE TYPE notification_type AS ENUM (
      'order_status',
      'payment_status',
      'shipping_update',
      'account_update',
      'security_alert',
      'price_drop',
      'back_in_stock',
      'new_product',
      'promotion',
      'review_request',
      'wishlist_update',
      'support',
      'system'
    );
  `);

  await knex.schema.raw(`
    CREATE TYPE notification_channel AS ENUM (
      'email',
      'sms',
      'push',
      'in_app',
      'webhook'
    );
  `);

  return knex.schema.createTable('notification', t => {
    t.uuid('notificationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId').notNullable();
    t.enu('userType', ['customer', 'merchant', 'admin'], { useNative: true, enumName: 'notification_user_type' }).notNullable().defaultTo('customer');
    t.specificType('type', 'notification_type').notNullable();
    t.string('title', 255).notNullable();
    t.text('content').notNullable();
    t.specificType('channel', 'notification_channel').notNullable();
    t.boolean('isRead').notNullable().defaultTo(false);
    t.timestamp('readAt');
    t.timestamp('sentAt');
    t.timestamp('deliveredAt');
    t.timestamp('expiresAt');
    t.text('actionUrl');
    t.string('actionLabel', 100);
    t.text('imageUrl');
    t.enu('priority', ['low', 'normal', 'high', 'urgent'], { useNative: true, enumName: 'notification_priority' }).notNullable().defaultTo('normal');
    t.string('category', 50);
    t.jsonb('data');
    t.jsonb('metadata');
    t.index('userId');
    t.index('userType');
    t.index('type');
    t.index('channel');
    t.index('isRead');
    t.index('sentAt');
    t.index('expiresAt');
    t.index('priority');
    t.index('category');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('notification');
  await knex.schema.raw('DROP TYPE IF EXISTS notification_user_type');
  await knex.schema.raw('DROP TYPE IF EXISTS notification_priority');
  await knex.schema.raw('DROP TYPE IF EXISTS notification_type');
  await knex.schema.raw('DROP TYPE IF EXISTS notification_channel');
};
