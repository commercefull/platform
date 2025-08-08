exports.up = function(knex) {
  return knex.schema.createTable('loyaltyTransaction', t => {
    t.uuid('loyaltyTransactionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    t.enum('action', ['credit', 'debit']).notNullable();
    t.integer('points').notNullable();
    t.text('description');
    t.uuid('referenceId');

    t.index('customerId');
    t.index('orderId');
    t.index('action');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('loyaltyTransaction');
};
