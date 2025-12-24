/**
 * Migration: Create Seller Policy Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('sellerPolicy');
  if (hasTable) return;

  await knex.schema.createTable('sellerPolicy', table => {
    table.uuid('sellerPolicyId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('sellerId').notNullable();
    table.text('returnsPolicy').nullable();
    table.text('shippingPolicy').nullable();
    table.integer('slaDays').defaultTo(3);
    table.jsonb('customPolicies').defaultTo('{}');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('sellerId');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sellerPolicy');
};
