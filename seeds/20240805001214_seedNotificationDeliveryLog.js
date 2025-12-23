/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const notification = await knex('notification').first('notificationId');

  if (!notification) {
    return;
  }

  return knex('notificationDeliveryLog').insert([
    {
      notificationId: notification.notificationId,
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'orderStatus',
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
  return knex('notificationDeliveryLog').where({ recipient: 'system' }).del();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
