/**
 * Creates assortmentCollectionPublication — store/channel visibility
 * scoping and per-scope merchandising order for collections.
 *
 * Semantics (same convention as contentPagePublication):
 * - a collection with NO publication rows is globally visible;
 * - a collection WITH rows is visible only where a row matches the
 *   request scope (NULL storeId/channelId = wildcard for that dimension);
 * - sortOrder positions the collection within that scope's listing.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('assortmentCollectionPublication');
  if (exists) return;

  await knex.schema.createTable('assortmentCollectionPublication', t => {
    t.uuid('assortmentCollectionPublicationId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('assortmentCollectionId').notNullable().references('assortmentCollectionId').inTable('assortmentCollection').onDelete('CASCADE');
    t.uuid('storeId').nullable().references('storeId').inTable('store').onDelete('CASCADE');
    t.uuid('channelId').nullable().references('salesChannelId').inTable('salesChannel').onDelete('CASCADE');
    t.integer('sortOrder').nullable();
    t.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['storeId', 'channelId']);
  });

  // Named unique constraint (not index) so ON CONFLICT ON CONSTRAINT can
  // target it for upserts; NULLS NOT DISTINCT makes NULL scopes unique.
  await knex.raw(`
    ALTER TABLE "assortmentCollectionPublication"
    ADD CONSTRAINT "uq_assortmentCollectionPublication_scope"
    UNIQUE NULLS NOT DISTINCT ("assortmentCollectionId", "storeId", "channelId")
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentCollectionPublication');
};
