/**
 * Seed test notifications for integration tests
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_NOTIFICATION_ID = '00000000-0000-0000-0000-000000000100';
const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000000001';

exports.seed = async function (knex) {
  // Delete existing test notification
  await knex('notification').where({ notificationId: TEST_NOTIFICATION_ID }).del();

  // Insert test notification
  await knex('notification').insert({
    notificationId: TEST_NOTIFICATION_ID,
    userId: TEST_CUSTOMER_ID,
    userType: 'customer',
    type: 'order_confirmation',
    title: 'Test Order Confirmation',
    content: 'Your test order has been confirmed.',
    channel: 'in_app',
    isRead: false,
    priority: 'normal',
    category: 'order',
    data: JSON.stringify({ orderNumber: 'TEST-001', orderTotal: 99.99 }),
    metadata: JSON.stringify({ source: 'seed' }),
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now()
  });
};
