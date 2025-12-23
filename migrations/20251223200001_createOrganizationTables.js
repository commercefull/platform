/**
 * Migration: Create Organization Tables
 * Adds organization hierarchy and settings tables for multi-tenant support
 */

exports.up = async function(knex) {
  // Create organization table if not exists
  const hasOrganization = await knex.schema.hasTable('organization');
  if (!hasOrganization) {
    await knex.schema.createTable('organization', (table) => {
      table.string('organizationId', 50).primary();
      table.string('parentOrganizationId', 50).nullable();
      table.string('name', 255).notNullable();
      table.string('slug', 100).unique().notNullable();
      table.string('type', 50).notNullable(); // 'platform', 'business', 'merchant', 'franchise'
      table.text('description').nullable();
      table.string('logoUrl', 500).nullable();
      table.string('websiteUrl', 500).nullable();
      table.string('contactEmail', 255).nullable();
      table.string('contactPhone', 50).nullable();
      table.string('timezone', 50).defaultTo('UTC');
      table.string('defaultCurrency', 3).defaultTo('USD');
      table.string('defaultLocale', 10).defaultTo('en');
      table.jsonb('settings').defaultTo('{}');
      table.jsonb('metadata').defaultTo('{}');
      table.boolean('isActive').defaultTo(true);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      table.timestamp('deletedAt').nullable();

      table.index('parentOrganizationId');
      table.index('type');
      table.index('slug');
      table.index('isActive');
    });
  }

  // Create organizationMember table for user-organization relationships
  const hasOrganizationMember = await knex.schema.hasTable('organizationMember');
  if (!hasOrganizationMember) {
    await knex.schema.createTable('organizationMember', (table) => {
      table.string('memberId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('userId', 50).notNullable();
      table.string('role', 50).notNullable(); // 'owner', 'admin', 'manager', 'member'
      table.jsonb('permissions').defaultTo('[]');
      table.boolean('isActive').defaultTo(true);
      table.timestamp('invitedAt').nullable();
      table.timestamp('acceptedAt').nullable();
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.unique(['organizationId', 'userId']);
      table.index('organizationId');
      table.index('userId');
      table.index('role');
    });
  }

  // Create organizationSettings table for detailed configurations
  const hasOrganizationSettings = await knex.schema.hasTable('organizationSettings');
  if (!hasOrganizationSettings) {
    await knex.schema.createTable('organizationSettings', (table) => {
      table.string('settingId', 50).primary();
      table.string('organizationId', 50).notNullable();
      table.string('category', 50).notNullable(); // 'billing', 'shipping', 'notifications', 'integrations'
      table.string('key', 100).notNullable();
      table.text('value').nullable();
      table.jsonb('valueJson').nullable();
      table.boolean('isEncrypted').defaultTo(false);
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.unique(['organizationId', 'category', 'key']);
      table.index('organizationId');
      table.index('category');
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('organizationSettings');
  await knex.schema.dropTableIfExists('organizationMember');
  await knex.schema.dropTableIfExists('organization');
};
