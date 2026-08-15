exports.up = function (knex) {
  return knex.schema.createTable('orderPaymentHistory', t => {
    t.uuid('orderPaymentHistoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.enum('paymentStatus', [
      'pending',
      'authorized',
      'paid',
      'partiallyPaid',
      'partiallyRefunded',
      'refunded',
      'failed',
      'voided',
      'requiresAction',
    ]).notNullable();
    t.uuid('transactionId');
    t.text('notes');

    t.index('orderId');
    t.index('paymentStatus');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('orderPaymentHistory');
};
