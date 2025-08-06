/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('notificationCategory').insert([
    { code: 'order', name: 'Orders', description: 'Order-related notifications', defaultPriority: 'high', isTransactional: true },
    { code: 'payment', name: 'Payments', description: 'Payment-related notifications', defaultPriority: 'high', isTransactional: true },
    { code: 'shipping', name: 'Shipping', description: 'Shipping and delivery notifications', defaultPriority: 'high', isTransactional: true },
    { code: 'account', name: 'Account', description: 'Account-related notifications', defaultPriority: 'normal', isTransactional: true },
    { code: 'security', name: 'Security', description: 'Security alerts and notifications', defaultPriority: 'urgent', isTransactional: true },
    { code: 'marketing', name: 'Marketing', description: 'Marketing and promotional notifications', defaultPriority: 'low', isTransactional: false },
    { code: 'system', name: 'System', description: 'System notifications and alerts', defaultPriority: 'normal', isTransactional: true },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('notificationCategory').whereIn('code', [
    'order',
    'payment',
    'shipping',
    'account',
    'security',
    'marketing',
    'system',
  ]).del();
};
