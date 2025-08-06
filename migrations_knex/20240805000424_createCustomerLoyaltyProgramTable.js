exports.up = function(knex) {
  return knex.schema.createTable('customerLoyaltyProgram', t => {
    t.uuid('customerLoyaltyProgramId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.string('pointsName', 50).notNullable().defaultTo('Points');
    t.string('pointsAbbreviation', 10).notNullable().defaultTo('pts');
    t.decimal('pointToValueRatio', 10, 4).notNullable().defaultTo(0.01);
    t.integer('minimumRedemption').notNullable().defaultTo(500);
    t.integer('redemptionMultiple').notNullable().defaultTo(100);
    t.integer('enrollmentBonus').defaultTo(0);
    t.jsonb('rules');
    t.jsonb('tiers');

    t.index('name');
    t.index('isActive');
    t.index('startDate');
    t.index('endDate');
  })

};

exports.down = function(knex) {
  return knex.schema.dropTable('customerLoyaltyProgram');
};
