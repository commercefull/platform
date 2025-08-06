exports.up = function(knex) {
  return knex.schema.createTable('loyalty_redemption', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('reward_id').notNullable().references('id').inTable('loyalty_reward').onDelete('RESTRICT');
    t.integer('points_spent').notNullable();
    t.string('redemption_code', 50).notNullable().unique();
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'loyalty_redemption_status' }).notNullable().defaultTo('pending');
    t.timestamp('used_at');
    t.timestamp('expires_at');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('customer_id');
    t.index('reward_id');
    t.index('redemption_code');
    t.index('status');
    t.index('expires_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyalty_redemption');
};
