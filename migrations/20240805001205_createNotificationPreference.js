/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('notificationPreference', t => {
    t.uuid('notificationPreferenceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('userId').notNullable();
    t.enum('userType', ['customer', 'merchant', 'admin']).notNullable().defaultTo('customer');
    t.enum('type', ['account_registration', 'password_reset', 'email_verification', 'order_confirmation', 'order_shipped', 'order_delivered', 'order_cancelled', 'return_initiated', 'refund_processed', 'back_in_stock', 'price_drop', 'new_product', 'review_request', 'abandoned_cart', 'coupon_offer', 'promotion']).notNullable();
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
