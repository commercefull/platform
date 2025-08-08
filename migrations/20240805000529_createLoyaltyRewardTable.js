exports.up = function(knex) {
  return knex.schema.createTable('loyaltyReward', t => {
    t.uuid('loyaltyRewardId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.integer('pointsCost').notNullable();
    t.decimal('discountAmount', 10, 2);
    t.decimal('discountPercent', 5, 2);
    t.string('discountCode', 50);
    t.boolean('freeShipping').notNullable().defaultTo(false);
    t.array('productIds').notNullable();
    t.timestamp('expiresAt');
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('pointsCost');
    t.index('isActive');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyaltyReward');
};
