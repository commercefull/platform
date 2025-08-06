exports.up = function(knex) {
  return knex.schema.createTable('tax_rule', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('tax_rate_id').notNullable().references('id').inTable('tax_rate').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.enu('condition_type', null, { useNative: true, existingType: true, enumName: 'tax_rule_condition_type' }).notNullable();
    t.jsonb('condition_value').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('tax_rate_id');
    t.index('condition_type');
    t.index('sort_order');
    t.index('is_active');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_rule');
};
