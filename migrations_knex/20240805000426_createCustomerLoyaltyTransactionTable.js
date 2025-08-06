exports.up = function(knex) {
  return knex.schema.createTable('customerLoyaltyTransaction', t => {
    t.uuid('customerLoyaltyTransactionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('accountId').notNullable().references('customerLoyaltyAccountId').inTable('customerLoyaltyAccount').onDelete('CASCADE');
    t.uuid('orderId').references('id').inTable('order');
    t.string('type', 20).notNullable().checkIn(['earn', 'redeem', 'adjust', 'expire', 'bonus', 'referral', 'refund']);
    t.integer('points').notNullable();
    t.integer('balance').notNullable();
    t.text('description').notNullable();
    t.string('source', 50).notNullable();
    t.string('status', 20).notNullable().defaultTo('completed').checkIn(['pending', 'completed', 'cancelled', 'expired']);
    t.timestamp('expiresAt');
    t.jsonb('metadata');

    t.index('accountId');
    t.index('orderId');
    t.index('type');
    t.index('status');
    t.index('expiresAt');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerLoyaltyTransaction');
};
