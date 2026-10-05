/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentStoreEntry');
  if (hasTable) return;

  await knex.schema.createTable('assortmentStoreEntry', t => {
    t.uuid('assortmentStoreEntryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('storeId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    // NULL = store-wide entry; set = channel-specific override.
    t.uuid('channelId').nullable().references('salesChannelId').inTable('salesChannel').onDelete('CASCADE');
    t.enu('targetType', ['product', 'collection', 'category']).notNullable();
    t.uuid('targetId').notNullable();
    t.enu('effect', ['include', 'exclude']).notNullable();
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isHidden').notNullable().defaultTo(false);

    t.index('storeId');
    t.index('channelId');
    t.index('targetId');
    t.index(['storeId', 'targetType']);
  });

  // Channel-aware uniqueness: one store-wide row per target plus one
  // channel-specific row per (target, channel). PostgreSQL unique constraints
  // treat NULLs as distinct, so partial indexes are required.
  await knex.raw(`
    CREATE UNIQUE INDEX "uq_assortmentStoreEntry_storeTarget_noChannel"
      ON "assortmentStoreEntry" ("storeId", "targetType", "targetId")
      WHERE "channelId" IS NULL
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX "uq_assortmentStoreEntry_storeTarget_channel"
      ON "assortmentStoreEntry" ("storeId", "targetType", "targetId", "channelId")
      WHERE "channelId" IS NOT NULL
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentStoreEntry');
};
