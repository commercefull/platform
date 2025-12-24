/**
 * Migration: Create Loyalty Reward Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('loyaltyReward');
  if (hasTable) return;

  await knex.schema.createTable('loyaltyReward', table => {
    table.uuid('rewardId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('programId').nullable();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('type', 30).notNullable(); // 'discount', 'free_product', 'free_shipping', 'experience', 'gift_card'
    table.integer('pointsCost').notNullable();
    table.decimal('value', 10, 2).nullable();
    table.string('valueType', 20).nullable(); // 'percentage', 'fixed'
    table.string('productId', 50).nullable();
    table.string('categoryId', 50).nullable();
    table.decimal('minOrderValue', 10, 2).nullable();
    table.integer('maxUsagePerCustomer').nullable();
    table.integer('totalQuantity').nullable();
    table.integer('remainingQuantity').nullable();
    table.integer('redemptionExpiryDays').nullable();
    table.timestamp('validFrom').nullable();
    table.timestamp('validTo').nullable();
    table.boolean('isActive').defaultTo(true);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('programId');
    table.index('type');
    table.index('isActive');
    table.index('pointsCost');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('loyaltyReward');
};
