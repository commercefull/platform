/**
 * Migration: Create Channel Product Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('channelProduct');
  if (hasTable) return;

  await knex.schema.createTable('channelProduct', table => {
    table.uuid('channelProductId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('channelId').notNullable().references('channelId').inTable('channel').onDelete('CASCADE');
    table.uuid('productId').notNullable();
    table.boolean('isVisible').defaultTo(true);
    table.boolean('isFeatured').defaultTo(false);
    table.decimal('priceOverride', 12, 2);
    table.decimal('salePriceOverride', 12, 2);
    table.integer('inventoryOverride');
    table.integer('sortOrder').defaultTo(0);
    table.timestamp('publishedAt');
    table.timestamp('unpublishedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['channelId', 'productId']);
    table.index(['channelId', 'isVisible']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('channelProduct');
};
