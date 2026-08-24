/**
 * Create theme, themeOverride, and themeAssignment tables.
 * Supports the theme engine: theme registry, per-store overrides, and store assignments.
 */

export async function up(knex) {
  // Theme table — stores theme definitions (built-in and custom)
  await knex.schema.createTable('theme', (table) => {
    table.string('themeId').primary();
    table.string('slug').notNullable().unique();
    table.string('name').notNullable();
    table.text('description');
    table.string('version').notNullable().defaultTo('1.0.0');
    table.enum('type', ['built_in', 'custom']).notNullable().defaultTo('custom');
    table.enum('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft');
    table.string('author');
    table.string('screenshotUrl');
    table.string('previewUrl');
    table.jsonb('settingsSchema').notNullable();
    table.jsonb('defaultSettings').notNullable();
    table.jsonb('layout').notNullable();
    table.jsonb('components').notNullable();
    table.jsonb('assets').notNullable().defaultTo('{}');
    table.jsonb('tags').notNullable().defaultTo('[]');
    table.boolean('isCustomizable').notNullable().defaultTo(true);
    table.string('organizationId').index();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['status', 'type']);
  });

  // Theme override table — per-store theme setting overrides
  await knex.schema.createTable('themeOverride', (table) => {
    table.string('overrideId').primary();
    table.string('storeId').notNullable().index();
    table.string('themeId').notNullable().index();
    table.string('organizationId').notNullable().index();
    table.jsonb('settings').notNullable().defaultTo('{}');
    table.text('customCss');
    table.string('customLogoUrl');
    table.string('customFaviconUrl');
    table.string('customBannerUrl');
    table.jsonb('customHeadTags').defaultTo('[]');
    table.jsonb('customBodyAttributes').defaultTo('{}');
    table.boolean('isActive').notNullable().defaultTo(true);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.unique(['storeId', 'themeId']);
  });

  // Theme assignment table — which theme is assigned to which store
  await knex.schema.createTable('themeAssignment', (table) => {
    table.string('storeId').primary();
    table.string('themeId').notNullable().index();
    table.string('organizationId').notNullable().index();
    table.string('overrideId');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('themeAssignment');
  await knex.schema.dropTableIfExists('themeOverride');
  await knex.schema.dropTableIfExists('theme');
}
