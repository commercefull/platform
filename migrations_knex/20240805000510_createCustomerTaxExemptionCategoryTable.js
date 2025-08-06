exports.up = function(knex) {
  return knex.schema.createTable('customer_tax_exemption_category', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('exemption_id').notNullable().references('id').inTable('customer_tax_exemption').onDelete('CASCADE');
    t.uuid('tax_category_id').notNullable().references('id').inTable('tax_category').onDelete('CASCADE');
    t.boolean('is_exempt').notNullable().defaultTo(true);
    t.text('notes');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('exemption_id');
    t.index('tax_category_id');
    t.unique(['exemption_id', 'tax_category_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_tax_exemption_category');
};
