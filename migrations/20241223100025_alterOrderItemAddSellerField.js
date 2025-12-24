/**
 * Migration: Add Seller ID to Order Item Table
 */

exports.up = async function (knex) {
  const hasSellerId = await knex.schema.hasColumn('orderItem', 'sellerId');
  if (hasSellerId) return;

  await knex.schema.alterTable('orderItem', table => {
    table.uuid('sellerId').nullable();
  });
};

exports.down = async function (knex) {
  const hasSellerId = await knex.schema.hasColumn('orderItem', 'sellerId');
  if (!hasSellerId) return;

  await knex.schema.alterTable('orderItem', table => {
    table.dropColumn('sellerId');
  });
};
