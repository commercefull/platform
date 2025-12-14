/**
 * Seed test users for integration testing
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Check if test users already exist (don't delete to avoid FK issues)
  const existingCustomer = await knex('customer').where({ email: 'customer@example.com' }).first();
  const existingAdmin = await knex('customer').where({ email: 'admin@example.com' }).first();
  
  // Insert test customer user if not exists
  if (!existingCustomer) {
    await knex('customer').insert({
      email: 'customer@example.com',
      password: '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC', // "password123"
      firstName: 'Test',
      lastName: 'Customer',
      isActive: true,
      isVerified: true,
      emailVerified: true
    });
  }

  // Insert test admin user as customer with admin-like properties
  if (!existingAdmin) {
    await knex('customer').insert({
      email: 'admin@example.com',
      password: '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC', // "password123"
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isVerified: true,
      emailVerified: true
    });
  }
};
