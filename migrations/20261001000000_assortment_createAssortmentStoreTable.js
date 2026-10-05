/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentStore');
  if (hasTable) return;

  await knex.schema.createTable('assortmentStore', t => {
    // Natural PK: a store has exactly one assortment config — the id IS the store's id.
    t.uuid('storeId').primary().references('storeId').inTable('store').onDelete('CASCADE');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.enu('mode', ['all', 'include', 'exclude']).notNullable().defaultTo('all');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentStore');
};
