/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notification', t => {
    t.uuid('notificationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    // User information
    t.uuid('userId').notNullable();
    t.enum('userType', ['customer', 'merchant', 'admin']).notNullable().defaultTo('customer');

    // Notification content
    t.enum('type', [
      'account_registration',
      'password_reset',
      'email_verification',
      'order_confirmation',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'return_initiated',
      'refund_processed',
      'back_in_stock',
      'price_drop',
      'new_product',
      'review_request',
      'abandoned_cart',
      'coupon_offer',
      'promotion',
    ]).notNullable();
    t.string('title', 255).notNullable();
    t.text('content').notNullable();

    // Channel and delivery
    t.enum('channel', ['email', 'sms', 'push', 'in_app']).notNullable(); // Array of channels: email, sms, push, in_app
    t.boolean('isRead').notNullable().defaultTo(false);
    t.timestamp('readAt');
    t.timestamp('sentAt');
    t.timestamp('deliveredAt');
    t.timestamp('expiresAt');

    // Actions and metadata
    t.string('actionUrl', 500);
    t.string('actionLabel', 100);
    t.string('imageUrl', 500);
    t.enum('priority', ['low', 'normal', 'high', 'urgent']).defaultTo('normal');
    t.string('category', 100);
    t.jsonb('data');
    t.jsonb('metadata');

    // Soft delete
    t.timestamp('deletedAt');

    // Indexes
    t.index('userType');
    t.index('type');
    t.index('isRead');
    t.index('sentAt');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notification');
};
