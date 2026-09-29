exports.up = function (knex) {
  return knex.schema.createTable('orderFulfillmentHistory', t => {
    t.uuid('orderFulfillmentHistoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.enum('fulfillmentStatus', [
      'unfulfilled',
      'partiallyFulfilled',
      'fulfilled',
      'partiallyShipped',
      'shipped',
      'delivered',
      'restocked',
      'failed',
      'cancelled',
      'pendingPickup',
      'pickedUp',
      'returned',
    ]).notNullable();
    t.text('notes');

    t.index('orderId');
    t.index('fulfillmentStatus');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('orderFulfillmentHistory');
};
