/**
 * Migration: Create Store Hierarchy Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeHierarchy');
  if (hasTable) return;

  await knex.schema.createTable('storeHierarchy', table => {
    table.uuid('storeHierarchyId').primary().defaultTo(knex.raw('uuidv7()'));
    table.string('businessId').notNullable();
    table.string('defaultStoreId');
    table.string('sharedInventoryPoolId');
    table.string('sharedCatalogId');
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['businessId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeHierarchy');
};
