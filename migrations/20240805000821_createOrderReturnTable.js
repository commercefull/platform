exports.up = function(knex) {
  return knex.schema.createTable('orderReturn', t => {
    t.uuid('orderReturnId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('returnNumber', 50).notNullable().unique();
    t.uuid('customerId').references('customerId').inTable('customer');
    t.enum('status', ['requested', 'approved', 'denied', 'inTransit', 'received', 'inspected', 'completed', 'cancelled']).notNullable().defaultTo('requested');
    t.enum('returnType', ['refund', 'exchange', 'storeCredit', 'repair']).notNullable();
    t.timestamp('requestedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('approvedAt');
    t.timestamp('receivedAt');
    t.timestamp('completedAt');
    t.string('rmaNumber', 100);
    t.uuid('paymentRefundId').references('paymentRefundId').inTable('paymentRefund');
    t.boolean('returnShippingPaid').notNullable().defaultTo(false);
    t.decimal('returnShippingAmount', 15, 2);
    t.text('returnShippingLabel');
    t.enum('returnCarrier', ['ups', 'fedex', 'dhl', 'usps', 'custom']).notNullable();
    t.string('returnTrackingNumber', 100);
    t.text('returnTrackingUrl');
    t.text('returnReason');
    t.text('returnInstructions'); 
    t.text('customerNotes');
    t.text('adminNotes');
    t.boolean('requiresInspection').notNullable().defaultTo(true);
    t.jsonb('inspectionPassedItems');
    t.jsonb('inspectionFailedItems');
    

    t.index('orderId');
    t.index('returnNumber');
    t.index('customerId');
    t.index('status');
    t.index('returnType');
    t.index('requestedAt');
    t.index('approvedAt');
    t.index('receivedAt');
    t.index('completedAt');
    t.index('rmaNumber');
    t.index('paymentRefundId');
    t.index('returnTrackingNumber');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderReturn');
};
