/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const PREFERENCES = [
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'order_confirmation',
    channelPreferences: { email: true, sms: true, push: true, in_app: true },
    isEnabled: true
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'order_shipped',
    channelPreferences: { email: true, sms: true, push: true, in_app: true },
    isEnabled: true
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'order_delivered',
    channelPreferences: { email: true, sms: true, push: true, in_app: true },
    isEnabled: true
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'promotion',
    channelPreferences: { email: false, sms: false, push: false, in_app: true },
    isEnabled: true
  }
];

exports.up = async function (knex) {
  for (const pref of PREFERENCES) {
    const payload = {
      ...pref,
      channelPreferences: JSON.stringify(pref.channelPreferences)
    };

    await knex('notificationPreference')
      .insert(payload)
      .onConflict(['userId', 'userType', 'type'])
      .merge();
  }
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

exports.seed = async function (knex) {
  return exports.up(knex);
};
