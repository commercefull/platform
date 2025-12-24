/**
 * Migration: Create Fulfillment Item Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('fulfillmentItem');
  if (hasTable) return;

  await knex.schema.createTable('fulfillmentItem', table => {
    table.uuid('fulfillmentItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('fulfillmentId').notNullable().references('fulfillmentId').inTable('fulfillment').onDelete('CASCADE');
    table.uuid('orderItemId').notNullable();
    table.uuid('productId').notNullable();
    table.uuid('variantId');
    table.string('sku').notNullable();
    table.string('name').notNullable();
    table.integer('quantityOrdered').notNullable();
    table.integer('quantityFulfilled').defaultTo(0);
    table.integer('quantityPicked');
    table.integer('quantityPacked');
    table.string('warehouseLocation');
    table.string('binLocation');
    table.jsonb('serialNumbers');
    table.jsonb('lotNumbers');
    table.boolean('isPicked').defaultTo(false);
    table.boolean('isPacked').defaultTo(false);
    table.timestamp('pickedAt');
    table.timestamp('packedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index(['fulfillmentId']);
    table.index(['productId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('fulfillmentItem');
};
