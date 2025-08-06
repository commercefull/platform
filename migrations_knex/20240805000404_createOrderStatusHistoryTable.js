exports.up = function(knex) {
  return knex.schema.createTable('orderStatusHistory', t => {
    t.uuid('orderStatusHistoryId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.enum('status', ['pending', 'processing', 'onHold', 'completed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed', 'paymentPending', 'paymentFailed', 'backordered']).notNullable();
    t.enum('previousStatus', ['pending', 'processing', 'onHold', 'completed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed', 'paymentPending', 'paymentFailed', 'backordered']).notNullable();
    t.text('notes');
    t.string('createdBy', 255);
    t.jsonb('metadata');


    t.index('orderId');
    t.index('status');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderStatusHistory');
};
