/**
 * Migration: Create Assortment Item Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('assortmentItem');
  if (hasTable) return;

  await knex.schema.createTable('assortmentItem', table => {
    table.uuid('assortmentItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('assortmentId').notNullable();
    table.string('productVariantId', 50).notNullable();
    table.string('visibility', 20).defaultTo('listed'); // 'listed', 'hidden'
    table.boolean('buyable').defaultTo(true);
    table.integer('minQty').defaultTo(1);
    table.integer('maxQty').nullable();
    table.integer('incrementQty').defaultTo(1);
    table.integer('leadTimeDays').nullable();
    table.date('discontinueDate').nullable();
    table.integer('sortOrder').defaultTo(0);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['assortmentId', 'productVariantId']);
    table.index('assortmentId');
    table.index('productVariantId');
    table.index('visibility');
    table.index('buyable');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('assortmentItem');
};
