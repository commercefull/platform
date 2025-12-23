/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipDiscountCodeUsage', t => {
    t.uuid('membershipDiscountCodeUsageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('discountCodeId').notNullable().references('membershipDiscountCodeId').inTable('membershipDiscountCode').onDelete('CASCADE');
    t.uuid('subscriptionId').notNullable().references('membershipSubscriptionId').inTable('membershipSubscription').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.timestamp('usedAt').notNullable().defaultTo(knex.fn.now());
    t.decimal('discountAmount', 10, 2).notNullable();

    t.index('discountCodeId');
    t.index('subscriptionId');
    t.index('customerId');
    t.index('usedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipDiscountCodeUsage');
};
