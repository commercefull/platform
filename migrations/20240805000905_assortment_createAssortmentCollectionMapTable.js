/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentCollectionMap');
  if (hasTable) return;

  await knex.schema.createTable('assortmentCollectionMap', t => {
    t.uuid('assortmentCollectionMapId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('assortmentCollectionId').notNullable().references('assortmentCollectionId').inTable('assortmentCollection').onDelete('CASCADE');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('addedManually').notNullable().defaultTo(true);

    t.index('productId');
    t.index('assortmentCollectionId');
    t.index('position');
    t.index('addedManually');
    t.unique(['productId', 'assortmentCollectionId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentCollectionMap');
};
