/**
 * Migration: Add Organization Fields to Channel Table
 */

exports.up = async function (knex) {
  // Check and add each column individually
  const hasOrgId = await knex.schema.hasColumn('channel', 'organizationId');
  if (!hasOrgId) {
    await knex.schema.alterTable('channel', table => {
      table.string('organizationId', 50).nullable();
    });
  }

  const hasRegion = await knex.schema.hasColumn('channel', 'region');
  if (!hasRegion) {
    await knex.schema.alterTable('channel', table => {
      table.string('region', 50).nullable();
    });
  }

  const hasDomain = await knex.schema.hasColumn('channel', 'domain');
  if (!hasDomain) {
    await knex.schema.alterTable('channel', table => {
      table.string('domain', 255).nullable();
    });
  }

  const hasAppId = await knex.schema.hasColumn('channel', 'appId');
  if (!hasAppId) {
    await knex.schema.alterTable('channel', table => {
      table.string('appId', 100).nullable();
    });
  }
};

exports.down = async function (knex) {
  const hasOrgId = await knex.schema.hasColumn('channel', 'organizationId');
  if (!hasOrgId) return;

  await knex.schema.alterTable('channel', table => {
    table.dropColumn('organizationId');
    table.dropColumn('region');
    table.dropColumn('domain');
    table.dropColumn('appId');
  });
};
