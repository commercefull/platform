/**
 * Seed test users for integration testing
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Delete existing test users
  await knex('customer').where({ email: 'customer@example.com' }).del();
  await knex('customer').where({ email: 'admin@example.com' }).del();
  
  // Insert test admin user (using merchant table for admin)
  // Note: Admin users are merchants in this platform
  
  // Insert test customer user
  await knex('customer').insert({
    email: 'customer@example.com',
    password: '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC', // "password123"
    firstName: 'Test',
    lastName: 'Customer',
    isActive: true,
    isVerified: true,
    emailVerified: true
  });

  // Insert test admin user as customer with admin-like properties
  await knex('customer').insert({
    email: 'admin@example.com',
    password: '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC', // "password123"
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    isVerified: true,
    emailVerified: true
  });
};
