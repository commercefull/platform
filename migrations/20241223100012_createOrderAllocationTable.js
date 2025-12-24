/**
 * Migration: Create Order Allocation Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('orderAllocation');
  if (hasTable) return;

  await knex.schema.createTable('orderAllocation', table => {
    table.uuid('orderAllocationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('orderLineId').notNullable();
    table.uuid('locationId').notNullable();
    table.uuid('sellerId').nullable(); // For marketplace
    table.integer('quantity').notNullable();
    table.string('status', 20).defaultTo('allocated'); // 'allocated', 'picked', 'packed', 'shipped'
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('orderLineId');
    table.index('locationId');
    table.index('sellerId');
    table.index('status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('orderAllocation');
};
