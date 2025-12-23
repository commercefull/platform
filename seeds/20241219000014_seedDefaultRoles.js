/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Check if roles already exist
  const existingRoles = await knex('role').where('isSystem', true).count('roleId as count').first();
  if (existingRoles && parseInt(existingRoles.count) > 0) {
    return;
  }

  await knex('role').insert([
    {
      roleId: knex.raw('gen_random_uuid()'),
      name: 'Super Admin',
      description: 'Full access to all features',
      permissions: JSON.stringify(['*']),
      isSystem: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      roleId: knex.raw('gen_random_uuid()'),
      name: 'Admin',
      description: 'Administrative access',
      permissions: JSON.stringify([
        'dashboard.view',
        'products.view',
        'products.create',
        'products.edit',
        'orders.view',
        'orders.edit',
        'customers.view',
        'analytics.view',
        'settings.view',
      ]),
      isSystem: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      roleId: knex.raw('gen_random_uuid()'),
      name: 'Editor',
      description: 'Content and product management',
      permissions: JSON.stringify(['dashboard.view', 'products.view', 'products.create', 'products.edit']),
      isSystem: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      roleId: knex.raw('gen_random_uuid()'),
      name: 'Viewer',
      description: 'Read-only access',
      permissions: JSON.stringify(['dashboard.view', 'products.view', 'orders.view', 'customers.view', 'analytics.view']),
      isSystem: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
