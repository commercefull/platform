exports.up = function(knex) {
  return knex.schema.createTable('tax_zone', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('is_default').notNullable().defaultTo(false);
    t.specificType('countries', 'varchar(2)[]').notNullable();
    t.specificType('states', 'varchar(10)[]');
    t.specificType('postcodes', 'text[]');
    t.specificType('cities', 'text[]');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('code');
    t.index('is_default');
    t.index('is_active');
    t.index('countries', 'tax_zone_countries_idx', 'gin');
    t.index('states', 'tax_zone_states_idx', 'gin');
    t.index('postcodes', 'tax_zone_postcodes_idx', 'gin');
    t.index('cities', 'tax_zone_cities_idx', 'gin');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_zone');
};
