/**
 * Migration: Add Seller ID to Basket Item Table
 */

exports.up = async function (knex) {
  const hasSellerId = await knex.schema.hasColumn('basketItem', 'sellerId');
  if (hasSellerId) return;

  await knex.schema.alterTable('basketItem', table => {
    table.uuid('sellerId').nullable();
  });
};

exports.down = async function (knex) {
  const hasSellerId = await knex.schema.hasColumn('basketItem', 'sellerId');
  if (!hasSellerId) return;

  await knex.schema.alterTable('basketItem', table => {
    table.dropColumn('sellerId');
  });
};
