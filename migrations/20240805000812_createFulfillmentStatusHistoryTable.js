exports.up = function(knex) {
  return knex.schema.createTable('fulfillmentStatusHistory', t => {
    t.uuid('fulfillmentStatusHistoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderFulfillmentId').notNullable().references('orderFulfillmentId').inTable('orderFulfillment').onDelete('CASCADE');
    t.enum('status', ['pending', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'partiallyDelivered', 'partiallyReturned', 'partiallyFailed', 'partiallyCancelled']).notNullable();
    t.enum('previousStatus', ['pending', 'shipped', 'delivered', 'cancelled', 'failed', 'returned', 'partiallyDelivered', 'partiallyReturned', 'partiallyFailed', 'partiallyCancelled']);
    t.text('notes');
    t.string('location', 255);
    

    t.index('orderFulfillmentId');
    t.index('status');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('fulfillmentStatusHistory');
};
