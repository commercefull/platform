exports.up = function(knex) {
  return knex.schema.createTable('loyaltyPoints', t => {
    t.uuid('loyaltyPointsId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('tierId').notNullable().references('loyaltyTierId').inTable('loyaltyTier').onDelete('RESTRICT');
    t.integer('currentPoints').notNullable().defaultTo(0);
    t.integer('lifetimePoints').notNullable().defaultTo(0);
    t.timestamp('lastActivity').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiryDate');

    t.unique('customerId');
    t.index('tierId');
    t.index('currentPoints');
    t.index('lifetimePoints');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyaltyPoints');
};
