/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('referralReward', function (table) {
    table.uuid('referralRewardId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('referralId').notNullable().references('referralId').inTable('referral').onDelete('CASCADE');
    table.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    table.string('recipientType').notNullable().checkIn(['referrer', 'referred']);
    table.string('rewardType').notNullable().checkIn(['discount', 'credit', 'points', 'free_shipping', 'free_product', 'cash']);
    table.decimal('rewardValue', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('discountCode');
    table.integer('pointsAwarded');
    table.uuid('freeProductId').references('productId').inTable('product').onDelete('SET NULL');
    table.string('status').defaultTo('pending').checkIn(['pending', 'issued', 'claimed', 'expired', 'cancelled']);
    table.timestamp('issuedAt');
    table.timestamp('claimedAt');
    table.uuid('claimedOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.timestamp('expiresAt');
    table.text('notes');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('referralId');
    table.index('customerId');
    table.index('status');
    table.index('discountCode');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('referralReward');
};
