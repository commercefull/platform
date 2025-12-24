/**
 * Migration: Create Assortment Scope Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentScope');
  if (hasTable) return;

  await knex.schema.createTable('assortmentScope', table => {
    table.uuid('assortmentScopeId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('assortmentId').notNullable();
    table.string('storeId', 50).nullable();
    table.string('sellerId', 50).nullable();
    table.string('accountId', 50).nullable();
    table.string('channelId', 50).nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index('assortmentId');
    table.index('storeId');
    table.index('sellerId');
    table.index('accountId');
    table.index('channelId');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentScope');
};
