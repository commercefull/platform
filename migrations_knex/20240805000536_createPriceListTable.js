exports.up = function(knex) {
  return knex.schema.createTable('price_list', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('priority').defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('start_date');
    t.timestamp('end_date');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('price_list');
};
