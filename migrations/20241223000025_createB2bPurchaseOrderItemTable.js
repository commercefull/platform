/**
 * Migration: Create B2B Purchase Order Item Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bPurchaseOrderItem');
  if (hasTable) return;

  await knex.schema.createTable('b2bPurchaseOrderItem', table => {
    table.uuid('b2bPurchaseOrderItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('purchaseOrderId').notNullable().references('purchaseOrderId').inTable('b2bPurchaseOrder').onDelete('CASCADE');
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('sku').notNullable();
    table.string('name').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unitPrice', 12, 2).notNullable();
    table.decimal('discount', 12, 2).defaultTo(0);
    table.decimal('total', 12, 2).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());

    table.index(['purchaseOrderId']);
    table.index(['productId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bPurchaseOrderItem');
};
