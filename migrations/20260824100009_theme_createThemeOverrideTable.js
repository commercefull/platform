/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('themeOverride');
  if (hasTable) return;

  await knex.schema.createTable('themeOverride', t => {
    t.uuid('overrideId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('storeId').notNullable().index();
    t.uuid('themeId').notNullable().index();
    t.uuid('organizationId').notNullable().index();
    t.jsonb('settings').notNullable().defaultTo('{}');
    t.text('customCss');
    t.string('customLogoUrl');
    t.string('customFaviconUrl');
    t.string('customBannerUrl');
    t.jsonb('customHeadTags').defaultTo('[]');
    t.jsonb('customBodyAttributes').defaultTo('{}');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['storeId', 'themeId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('themeOverride');
};
