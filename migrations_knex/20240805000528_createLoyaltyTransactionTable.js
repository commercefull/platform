exports.up = function(knex) {
  return knex.schema.createTable('loyalty_transaction', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('order_id').references('id').inTable('order').onDelete('SET NULL');
    t.enu('action', null, { useNative: true, existingType: true, enumName: 'loyalty_transaction_action' }).notNullable();
    t.integer('points').notNullable();
    t.text('description');
    t.uuid('reference_id');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('customer_id');
    t.index('order_id');
    t.index('action');
    t.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyalty_transaction');
};
