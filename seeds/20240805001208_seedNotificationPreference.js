/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('notificationPreference').insert([
    {
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'order_status',
      channelPreferences: JSON.stringify({ email: true, sms: true, push: true, in_app: true }),
      isEnabled: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'payment_status',
      channelPreferences: JSON.stringify({ email: true, sms: true, push: true, in_app: true }),
      isEnabled: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'shipping_update',
      channelPreferences: JSON.stringify({ email: true, sms: true, push: true, in_app: true }),
      isEnabled: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      type: 'promotion',
      channelPreferences: JSON.stringify({ email: false, sms: false, push: false, in_app: true }),
      isEnabled: true,
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationPreference')
    .where({ userId: '00000000-0000-0000-0000-000000000001' })
    .del();
};
