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
    t.enum('type', ['account_registration', 'password_reset', 'email_verification', 'order_confirmation', 'order_shipped', 'order_delivered', 'order_cancelled', 'return_initiated', 'refund_processed', 'back_in_stock', 'price_drop', 'new_product', 'review_request', 'abandoned_cart', 'coupon_offer', 'promotion']).notNullable();
    t.enum('supportedChannels', ['email', 'sms', 'push', 'in_app']).notNullable();
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
    t.index('supportedChannels');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('notificationTemplate');
};
