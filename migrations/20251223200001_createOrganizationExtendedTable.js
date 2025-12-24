/**
 * Migration: Create Extended Organization Table
 * Adds additional organization fields if organization table exists, or creates full table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('organization');
  
  if (!hasTable) {
    // Create full organization table with extended fields
    await knex.schema.createTable('organization', table => {
      table.uuid('organizationId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('parentOrganizationId').nullable();
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
  } else {
    // Add extended fields to existing organization table
    const hasParentOrgId = await knex.schema.hasColumn('organization', 'parentOrganizationId');
    if (!hasParentOrgId) {
      await knex.schema.alterTable('organization', table => {
        table.uuid('parentOrganizationId').nullable();
        table.text('description').nullable();
        table.string('logoUrl', 500).nullable();
        table.string('websiteUrl', 500).nullable();
        table.string('contactEmail', 255).nullable();
        table.string('contactPhone', 50).nullable();
        table.string('timezone', 50).defaultTo('UTC');
        table.string('defaultCurrency', 3).defaultTo('USD');
        table.string('defaultLocale', 10).defaultTo('en');
        table.jsonb('metadata').defaultTo('{}');
        table.boolean('isActive').defaultTo(true);
      });
    }
  }
};

exports.down = async function (knex) {
  const hasParentOrgId = await knex.schema.hasColumn('organization', 'parentOrganizationId');
  if (hasParentOrgId) {
    await knex.schema.alterTable('organization', table => {
      table.dropColumn('parentOrganizationId');
      table.dropColumn('description');
      table.dropColumn('logoUrl');
      table.dropColumn('websiteUrl');
      table.dropColumn('contactEmail');
      table.dropColumn('contactPhone');
      table.dropColumn('timezone');
      table.dropColumn('defaultCurrency');
      table.dropColumn('defaultLocale');
      table.dropColumn('metadata');
      table.dropColumn('isActive');
    });
  }
};
