exports.up = function(knex) {
  return knex.schema.createTable('customerLoyaltyAccount', t => {
    t.uuid('customerLoyaltyAccountId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('programId').notNullable().references('customerLoyaltyProgramId').inTable('customerLoyaltyProgram').onDelete('CASCADE');
    t.string('memberNumber', 50);
    t.string('tier', 50).defaultTo('Standard');
    t.integer('pointsBalance').notNullable().defaultTo(0);
    t.integer('pointsEarned').notNullable().defaultTo(0);
    t.integer('pointsSpent').notNullable().defaultTo(0);
    t.integer('pointsExpired').notNullable().defaultTo(0);
    t.timestamp('lastActivity');
    t.timestamp('enrolledAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiresAt');
    t.boolean('isActive').notNullable().defaultTo(true);
    

    t.index('customerId');
    t.index('programId');
    t.unique('memberNumber');
    t.index('tier');
    t.index('pointsBalance');
    t.index('isActive');
    t.index('lastActivity');
    t.unique(['customerId', 'programId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerLoyaltyAccount');
};
