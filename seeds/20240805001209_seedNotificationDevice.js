/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('notificationDevice').insert([
    {
      userId: '00000000-0000-0000-0000-000000000001',
      userType: 'customer',
      deviceToken: 'sample_device_token_for_testing',
      deviceType: 'ios',
      deviceName: 'iPhone',
      deviceModel: 'iPhone 14 Pro',
      appVersion: '1.0.0',
      osVersion: '16.0',
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationDevice')
    .where({ deviceToken: 'sample_device_token_for_testing' })
    .del();
};
