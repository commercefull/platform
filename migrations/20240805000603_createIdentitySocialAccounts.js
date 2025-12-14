/**
 * Migration: Create Identity Social Accounts Table
 * 
 * Stores OAuth/social login provider connections for customers and merchants.
 * Supports Google, Facebook, Apple, GitHub, Twitter/X, LinkedIn, and Microsoft.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('identitySocialAccount', (table) => {
    // Primary key
    table.uuid('socialAccountId').primary().defaultTo(knex.fn.uuid());
    
    // User reference (polymorphic - can be customer or merchant)
    table.uuid('userId').notNullable().index();
    table.string('userType', 20).notNullable().defaultTo('customer'); // 'customer' | 'merchant'
    
    // OAuth provider information
    table.string('provider', 50).notNullable(); // 'google' | 'facebook' | 'apple' | 'github' | 'twitter' | 'linkedin' | 'microsoft'
    table.string('providerUserId', 255).notNullable(); // ID from the OAuth provider
    table.string('providerEmail', 255); // Email from provider (may differ from account email)
    
    // Profile data from provider
    table.string('displayName', 255);
    table.string('firstName', 100);
    table.string('lastName', 100);
    table.text('avatarUrl');
    table.text('profileUrl');
    
    // OAuth tokens (encrypted in production)
    table.text('accessToken');
    table.text('refreshToken');
    table.timestamp('tokenExpiresAt');
    
    // Scopes granted by user
    table.text('scopes'); // JSON array of granted scopes
    
    // Account status
    table.boolean('isActive').notNullable().defaultTo(true);
    table.boolean('isPrimary').notNullable().defaultTo(false); // Primary social login method
    
    // Metadata
    table.jsonb('providerData'); // Additional provider-specific data
    table.timestamp('lastUsedAt');
    table.string('lastLoginIp', 45);
    
    // Timestamps
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    
    // Unique constraint: one provider account per user
    table.unique(['userId', 'userType', 'provider']);
    
    // Unique constraint: provider user ID must be unique per provider
    table.unique(['provider', 'providerUserId']);
    
    // Indexes for common queries
    table.index(['provider', 'providerEmail']);
    table.index(['userType', 'userId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('identitySocialAccount');
};
