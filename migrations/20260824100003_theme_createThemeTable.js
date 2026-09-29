/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('theme');
  if (hasTable) return;

  await knex.schema.createTable('theme', t => {
    t.uuid('themeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.string('slug').notNullable().unique();
    t.string('name').notNullable();
    t.text('description');
    t.string('version').notNullable().defaultTo('1.0.0');
    t.enum('type', ['built_in', 'custom']).notNullable().defaultTo('custom');
    t.enum('status', ['draft', 'active', 'archived']).notNullable().defaultTo('draft');
    t.string('author');
    t.string('screenshotUrl');
    t.string('previewUrl');
    t.jsonb('settingsSchema').notNullable();
    t.jsonb('defaultSettings').notNullable();
    t.jsonb('layout').notNullable();
    t.jsonb('components').notNullable();
    t.jsonb('assets').notNullable().defaultTo('{}');
    t.jsonb('tags').notNullable().defaultTo('[]');
    t.boolean('isCustomizable').notNullable().defaultTo(true);
    t.uuid('organizationId').index();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index(['status', 'type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('theme');
};
