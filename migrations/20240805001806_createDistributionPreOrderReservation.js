/**
 * Distribution Pre-Order Reservation Migration
 * Creates the distributionPreOrderReservation table for customer pre-order reservations
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionPreOrderReservation', function(table) {
    table.uuid('distributionPreOrderReservationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('distributionPreOrderId').notNullable().references('distributionPreOrderId').inTable('distributionPreOrder').onDelete('CASCADE');
    table.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    table.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.string('reservationNumber').unique();
    table.string('status').defaultTo('pending'); // pending, confirmed, fulfilled, cancelled, refunded
    table.integer('quantity').defaultTo(1);
    table.decimal('unitPrice', 15, 2).notNullable();
    table.decimal('totalPrice', 15, 2).notNullable();
    table.decimal('depositPaid', 15, 2).defaultTo(0);
    table.decimal('balanceDue', 15, 2);
    table.string('currency', 3).defaultTo('USD');
    table.timestamp('depositPaidAt');
    table.timestamp('balancePaidAt');
    table.string('paymentIntentId');
    table.timestamp('estimatedFulfillmentAt');
    table.timestamp('fulfilledAt');
    table.timestamp('cancelledAt');
    table.string('cancellationReason');
    table.boolean('notificationSent').defaultTo(false);
    table.timestamp('notificationSentAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('distributionPreOrderId');
    table.index('customerId');
    table.index('orderId');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('distributionPreOrderReservation');
};
