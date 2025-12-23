/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const CATEGORIES = [
  { code: 'order', name: 'Orders', description: 'Order-related notifications', defaultPriority: 'high', isTransactional: true },
  { code: 'payment', name: 'Payments', description: 'Payment-related notifications', defaultPriority: 'high', isTransactional: true },
  {
    code: 'shipping',
    name: 'Shipping',
    description: 'Shipping and delivery notifications',
    defaultPriority: 'high',
    isTransactional: true,
  },
  { code: 'account', name: 'Account', description: 'Account-related notifications', defaultPriority: 'normal', isTransactional: true },
  { code: 'security', name: 'Security', description: 'Security alerts and notifications', defaultPriority: 'high', isTransactional: true },
  {
    code: 'marketing',
    name: 'Marketing',
    description: 'Marketing and promotional notifications',
    defaultPriority: 'low',
    isTransactional: false,
  },
  { code: 'system', name: 'System', description: 'System notifications and alerts', defaultPriority: 'normal', isTransactional: true },
];

exports.up = async function (knex) {
  for (const category of CATEGORIES) {
    await knex('notificationCategory').insert(category).onConflict('code').merge();
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationCategory')
    .whereIn(
      'code',
      CATEGORIES.map(c => c.code),
    )
    .del();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
