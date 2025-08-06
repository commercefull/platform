exports.up = function(knex) {
  return knex.schema.createTable('loyalty_points', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('tier_id').notNullable().references('id').inTable('loyalty_tier').onDelete('RESTRICT');
    t.integer('current_points').notNullable().defaultTo(0);
    t.integer('lifetime_points').notNullable().defaultTo(0);
    t.timestamp('last_activity').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiry_date');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.unique('customer_id');
    t.index('tier_id');
    t.index('current_points');
    t.index('lifetime_points');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyalty_points');
};
