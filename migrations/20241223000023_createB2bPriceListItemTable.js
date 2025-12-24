/**
 * Migration: Create B2B Price List Item Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bPriceListItem');
  if (hasTable) return;

  await knex.schema.createTable('b2bPriceListItem', table => {
    table.uuid('priceListItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('priceListId').notNullable().references('priceListId').inTable('b2bPriceList').onDelete('CASCADE');
    table.string('productId').notNullable();
    table.string('variantId');
    table.decimal('price', 12, 2).notNullable();
    table.decimal('minQuantity', 12, 2).defaultTo(1);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['priceListId', 'productId', 'variantId']);
    table.index(['productId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bPriceListItem');
};
