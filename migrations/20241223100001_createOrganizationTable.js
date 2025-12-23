/**
 * Migration: Create Organization Table
 * Phase 1: Foundation - Multi-tenant root entity
 */

exports.up = async function(knex) {
  // Create organization table
  await knex.schema.createTable('organization', (table) => {
    table.string('organizationId', 50).primary();
    table.string('name', 255).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.string('type', 50).defaultTo('single'); // 'single', 'multi_store', 'marketplace', 'b2b'
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();
    
    table.index('slug');
    table.index('type');
  });

  // Add organizationId to store table
  const hasStoreOrgId = await knex.schema.hasColumn('store', 'organizationId');
  if (!hasStoreOrgId) {
    await knex.schema.alterTable('store', (table) => {
      table.string('organizationId', 50).nullable();
      table.string('taxZoneId', 50).nullable();
      table.jsonb('priceRoundingRules').defaultTo('{}');
      table.string('defaultCurrency', 3).defaultTo('USD');
      table.string('defaultLanguage', 10).defaultTo('en');
    });
  }

  // Add organizationId to channel table
  const hasChannelOrgId = await knex.schema.hasColumn('channel', 'organizationId');
  if (!hasChannelOrgId) {
    await knex.schema.alterTable('channel', (table) => {
      table.string('organizationId', 50).nullable();
      table.string('region', 50).nullable();
      table.string('domain', 255).nullable();
      table.string('appId', 100).nullable();
    });
  }

  // Add organizationId to product table
  const hasProductOrgId = await knex.schema.hasColumn('product', 'organizationId');
  if (!hasProductOrgId) {
    await knex.schema.alterTable('product', (table) => {
      table.string('organizationId', 50).nullable();
      table.string('approvalStatus', 20).defaultTo('approved');
      table.boolean('platformVisible').defaultTo(true);
    });
  }

  // Create storeChannel junction table
  const hasStoreChannel = await knex.schema.hasTable('storeChannel');
  if (!hasStoreChannel) {
    await knex.schema.createTable('storeChannel', (table) => {
      table.string('storeChannelId', 50).primary();
      table.string('storeId', 50).notNullable();
      table.string('channelId', 50).notNullable();
      table.string('status', 20).defaultTo('active'); // 'active', 'inactive', 'pending'
      table.timestamp('launchDate').nullable();
      table.jsonb('settings').defaultTo('{}');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());
      
      table.unique(['storeId', 'channelId']);
      table.index('storeId');
      table.index('channelId');
      table.index('status');
    });
  }

  // Insert default organization
  const existingOrg = await knex('organization').where('organizationId', 'org_default').first();
  if (!existingOrg) {
    await knex('organization').insert({
      organizationId: 'org_default',
      name: 'Default Organization',
      slug: 'default',
      type: 'single',
      settings: JSON.stringify({}),
    });
  }

  // Update existing stores to reference default organization
  await knex('store').whereNull('organizationId').update({ organizationId: 'org_default' });
};

exports.down = async function(knex) {
  // Remove storeChannel table
  await knex.schema.dropTableIfExists('storeChannel');

  // Remove added columns from product
  const hasProductOrgId = await knex.schema.hasColumn('product', 'organizationId');
  if (hasProductOrgId) {
    await knex.schema.alterTable('product', (table) => {
      table.dropColumn('organizationId');
      table.dropColumn('approvalStatus');
      table.dropColumn('platformVisible');
    });
  }

  // Remove added columns from channel
  const hasChannelOrgId = await knex.schema.hasColumn('channel', 'organizationId');
  if (hasChannelOrgId) {
    await knex.schema.alterTable('channel', (table) => {
      table.dropColumn('organizationId');
      table.dropColumn('region');
      table.dropColumn('domain');
      table.dropColumn('appId');
    });
  }

  // Remove added columns from store
  const hasStoreOrgId = await knex.schema.hasColumn('store', 'organizationId');
  if (hasStoreOrgId) {
    await knex.schema.alterTable('store', (table) => {
      table.dropColumn('organizationId');
      table.dropColumn('taxZoneId');
      table.dropColumn('priceRoundingRules');
      table.dropColumn('defaultCurrency');
      table.dropColumn('defaultLanguage');
    });
  }

  // Remove organization table
  await knex.schema.dropTableIfExists('organization');
};
