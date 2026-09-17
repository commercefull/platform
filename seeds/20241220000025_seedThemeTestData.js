/**
 * Theme Test Data Seed
 * Seeds a theme and an organization-owned theme override for
 * themeOps integration tests (override list/update).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';
const STORE_ID = '00000000-0000-0000-0000-000000000001';
const THEME_ID = '0193e000-0000-7000-8000-000000000001';
const OVERRIDE_ID = '0193e001-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  const hasTheme = await knex.schema.hasTable('theme');
  if (!hasTheme) {
    return;
  }

  const now = new Date();

  await knex('theme').where('themeId', THEME_ID).del();
  await knex('theme').insert({
    themeId: THEME_ID,
    slug: 'ops-theme',
    name: 'Ops Theme',
    version: '1.0.0',
    type: 'custom',
    status: 'active',
    settingsSchema: JSON.stringify({}),
    defaultSettings: JSON.stringify({ primaryColor: '#123456' }),
    layout: JSON.stringify({}),
    components: JSON.stringify([]),
    assets: JSON.stringify({}),
    tags: JSON.stringify([]),
    isCustomizable: true,
    organizationId: ORGANIZATION_ID,
    createdAt: now,
    updatedAt: now,
  });

  const hasThemeOverride = await knex.schema.hasTable('themeOverride');
  if (hasThemeOverride) {
    await knex('themeOverride').where('overrideId', OVERRIDE_ID).del();
    await knex('themeOverride').insert({
      overrideId: OVERRIDE_ID,
      storeId: STORE_ID,
      themeId: THEME_ID,
      organizationId: ORGANIZATION_ID,
      settings: JSON.stringify({ primaryColor: '#EF4444' }),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
};
