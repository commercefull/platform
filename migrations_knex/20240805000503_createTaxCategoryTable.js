exports.up = function(knex) {
  return knex.schema.createTable('tax_category', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('is_default').notNullable().defaultTo(false);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('code');
    t.index('is_default');
    t.index('is_active');
    t.index('sort_order');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_category');
};
