exports.up = function(knex) {
  return knex.schema.createTable('customer_price_list', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('price_list_id').notNullable().references('id').inTable('price_list').onDelete('CASCADE');
    t.uuid('customer_id').references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('customer_group_id').references('id').inTable('customer_group').onDelete('CASCADE');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('customer_id');
    t.index('customer_group_id');
  })
  .then(() => {
    return knex.schema.raw(`
      ALTER TABLE customer_price_list
      ADD CONSTRAINT customer_price_list_customer_check
      CHECK ((customer_id IS NOT NULL AND customer_group_id IS NULL) OR (customer_id IS NULL AND customer_group_id IS NOT NULL));
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_price_list');
};
