exports.up = function(knex) {
  return knex.schema.createTable('loyaltyRedemption', t => {
    t.uuid('loyaltyRedemptionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('rewardId').notNullable().references('loyaltyRewardId').inTable('loyaltyReward').onDelete('RESTRICT');
    t.integer('pointsSpent').notNullable();
    t.string('redemptionCode', 50).notNullable().unique();
    t.enum('status', ['pending', 'completed', 'cancelled']).notNullable().defaultTo('pending');
    t.timestamp('usedAt');
    t.timestamp('expiresAt');

    t.index('customerId');
    t.index('rewardId');
    t.index('redemptionCode');
    t.index('status');
    t.index('expiresAt');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyaltyRedemption');
};
