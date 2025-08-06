/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const notification = await knex('notification').first('notificationId');

  if (!notification) {
    console.log('No notifications found, skipping seed for notificationDeliveryLog.');
    return;
  }

  return knex('notificationDeliveryLog').insert([
    {
      notificationId: notification.notificationId,
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'order_status',
      channel: 'in_app',
      recipient: 'system',
      status: 'delivered',
      sentAt: knex.fn.now(),
      provider: 'internal',
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationDeliveryLog')
    .where({ recipient: 'system' })
    .del();
};
