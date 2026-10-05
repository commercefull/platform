/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentCollection');
  if (hasTable) return;

  await knex.schema.createTable('assortmentCollection', t => {
    t.uuid('assortmentCollectionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.string('slug', 255).unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isAutomated').notNullable().defaultTo(false);
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.text('imageUrl');
    t.text('bannerUrl');
    t.string('metaTitle', 255);
    t.text('metaDescription');
    t.jsonb('conditions');
    t.string('sortOrder', 50).defaultTo('manual');
    t.timestamp('publishAt');
    t.timestamp('unpublishAt');
    t.timestamp('deletedAt');
    t.uuid('organizationId').references('organizationId').inTable('organization');

    t.index('slug');
    t.index('isActive');
    t.index('isAutomated');
    t.index('isFeatured');
    t.index('organizationId');
    t.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentCollection');
};
