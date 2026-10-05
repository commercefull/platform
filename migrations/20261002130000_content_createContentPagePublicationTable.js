/**
 * Creates the contentPagePublication table.
 *
 * A content page becomes storefront-visible for a context when a publication
 * row matches it: required storeId, optional channelId (null = all channels
 * of the store) and optional locale (null = all locales).
 * Pages with no publication rows stay globally visible (backward compatible).
 */
exports.up = async function (knex) {
  if (await knex.schema.hasTable('contentPagePublication')) return;
  await knex.schema.createTable('contentPagePublication', t => {
    t.uuid('contentPagePublicationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('contentPageId').notNullable().references('contentPageId').inTable('contentPage').onDelete('CASCADE');
    t.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('channelId').references('salesChannelId').inTable('salesChannel').onDelete('CASCADE');
    t.string('locale', 20);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('contentPageId');
    t.index('storeId');
    t.index(['storeId', 'channelId']);
  });
  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "contentPagePublication_uniqueContext"
       ON "contentPagePublication" ("contentPageId", "storeId", "channelId", "locale")
       NULLS NOT DISTINCT`,
  );
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('contentPagePublication')) {
    await knex.schema.dropTable('contentPagePublication');
  }
};
