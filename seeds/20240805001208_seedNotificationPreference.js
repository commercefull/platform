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
    isEnabled: true,
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'order_shipped',
    channelPreferences: { email: true, sms: true, push: true, in_app: true },
    isEnabled: true,
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'order_delivered',
    channelPreferences: { email: true, sms: true, push: true, in_app: true },
    isEnabled: true,
  },
  {
    userId: '00000000-0000-0000-0000-000000000001',
    userType: 'customer',
    type: 'promotion',
    channelPreferences: { email: false, sms: false, push: false, in_app: true },
    isEnabled: true,
  },
];

// Fixed ID for the order_confirmation preference so tests can reference it directly
const TEST_PREFERENCE_ID = '00000000-0000-0000-0000-000000000105';

exports.up = async function (knex) {
  // customerId is a generated uuid7 — resolve by email
  const testCustomer = await knex('customer').where({ email: 'customer@example.com' }).first('customerId');
  const userId = testCustomer ? testCustomer.customerId : '00000000-0000-0000-0000-000000000001';

  for (const pref of PREFERENCES) {
    const isTestPref = pref.type === 'order_confirmation';
    const payload = {
      ...pref,
      userId,
      // Align the order_confirmation row with testPreferenceData in tests/integration/notification/testUtils.ts
      channelPreferences: JSON.stringify(
        isTestPref ? { email: true, sms: false, in_app: true, push: false } : pref.channelPreferences,
      ),
      schedulePreferences: JSON.stringify(
        isTestPref ? { doNotDisturbStart: '22:00', doNotDisturbEnd: '08:00', timezone: 'UTC' } : null,
      ),
    };

    if (isTestPref) {
      await knex('notificationPreference')
        .insert({ notificationPreferenceId: TEST_PREFERENCE_ID, ...payload })
        .onConflict(['userId', 'userType', 'type'])
        .merge();
    } else {
      await knex('notificationPreference').insert(payload).onConflict(['userId', 'userType', 'type']).merge();
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationPreference').where({ userId: '00000000-0000-0000-0000-000000000001' }).del();
};

exports.seed = async function (knex) {
  return exports.up(knex);
};
