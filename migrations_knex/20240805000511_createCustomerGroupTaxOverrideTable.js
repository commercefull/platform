exports.up = function(knex) {
  return knex.schema.createTable('customer_group_tax_override', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_group_id').notNullable(); // In the original migration, this did not have a foreign key constraint
    t.uuid('tax_category_id').notNullable().references('id').inTable('tax_category').onDelete('CASCADE');
    t.uuid('tax_rate_id').references('id').inTable('tax_rate').onDelete('SET NULL');
    t.boolean('is_exempt').notNullable().defaultTo(false);
    t.text('exemption_reason');
    t.decimal('override_rate', 10, 6);
    t.timestamp('start_date').notNullable().defaultTo(knex.fn.now());
    t.timestamp('end_date');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('customer_group_id');
    t.index('tax_category_id');
    t.index('tax_rate_id');
    t.index('is_exempt');
    t.index('start_date');
    t.index('end_date');
    t.index('is_active');
    t.unique(['customer_group_id', 'tax_category_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_group_tax_override');
};
