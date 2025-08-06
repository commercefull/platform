exports.up = function(knex) {
  return knex.schema.createTable('loyalty_tier', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.text('description');
    t.enu('type', null, { useNative: true, existingType: true, enumName: 'loyalty_tier_type' }).notNullable();
    t.integer('points_threshold').notNullable();
    t.decimal('multiplier', 3, 2).notNullable().defaultTo(1.0);
    t.specificType('benefits', 'text[]');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('points_threshold');
    t.index('is_active');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyalty_tier');
};
