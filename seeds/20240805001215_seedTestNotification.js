/**
 * Seed test notifications for integration tests
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_NOTIFICATION_ID = '00000000-0000-0000-0000-000000000100';
const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_BATCH_ID = '00000000-0000-0000-0000-000000000101';
const TEST_WEBHOOK_ID = '00000000-0000-0000-0000-000000000102';
const TEST_TEMPLATE_ID = '00000000-0000-0000-0000-000000000103';

exports.seed = async function (knex) {
  // Delete existing test notification
  await knex('notification').where({ notificationId: TEST_NOTIFICATION_ID }).del();

  // Insert test notification
  await knex('notification').insert({
    notificationId: TEST_NOTIFICATION_ID,
    userId: TEST_CUSTOMER_ID,
    userType: 'customer',
    type: 'order_confirmation',
    title: 'Your order has been confirmed',
    content: 'Thank you for your order! Your order #TEST-123 has been confirmed and is being processed.',
    channel: 'in_app',
    isRead: false,
    priority: 'normal',
    category: 'order',
    data: JSON.stringify({ orderNumber: 'TEST-123', orderTotal: 99.99 }),
    metadata: JSON.stringify({ source: 'seed' }),
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });

  // Batch for GET /business/notifications/batches/:batchId
  if (await knex.schema.hasTable('notificationBatch')) {
    await knex('notificationBatch').where({ notificationBatchId: TEST_BATCH_ID }).del();
    await knex('notificationBatch').insert({
      notificationBatchId: TEST_BATCH_ID,
      name: 'Ops Test Batch',
      type: 'promotion',
      channel: 'inApp',
      status: 'draft',
      contentData: JSON.stringify({ title: 'Ops Test Batch', content: 'Batch notification content' }),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }

  // Webhook for DELETE /business/notifications/webhooks/:webhookId
  if (await knex.schema.hasTable('notificationWebhook')) {
    await knex('notificationWebhook').where({ notificationWebhookId: TEST_WEBHOOK_ID }).del();
    await knex('notificationWebhook').insert({
      notificationWebhookId: TEST_WEBHOOK_ID,
      name: 'Ops Test Webhook',
      url: 'https://example.com/webhook-ops-seeded',
      events: JSON.stringify(['notification.sent']),
      format: 'json',
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }

  // Template for /business/notifications/templates/:templateId/translations
  if (await knex.schema.hasTable('notificationTemplate')) {
    await knex('notificationTemplate').where({ notificationTemplateId: TEST_TEMPLATE_ID }).del();
    await knex('notificationTemplate').insert({
      notificationTemplateId: TEST_TEMPLATE_ID,
      code: 'test-template-seeded',
      name: 'Test Template',
      description: 'Template created for integration tests',
      type: 'order_confirmation',
      supportedChannels: JSON.stringify(['email', 'in_app']),
      defaultChannel: 'email',
      subject: 'Test notification subject',
      htmlTemplate: '<h1>Hello {{name}}</h1><p>This is a test notification.</p>',
      textTemplate: 'Hello {{name}}. This is a test notification.',
      parameters: JSON.stringify({ name: 'string', testParam: 'string' }),
      isActive: true,
      categoryCode: 'order',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    });
  }
};
