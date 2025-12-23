exports.up = function (knex) {
  return knex.schema.createTable('subscriptionInvoice', t => {
    t.uuid('subscriptionInvoiceId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('paymentSubscriptionId').notNullable().references('paymentSubscriptionId').inTable('paymentSubscription').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer');
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant');
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.string('status', 20).notNullable().checkIn(['draft', 'open', 'paid', 'past_due', 'failed', 'voided']).defaultTo('draft');
    t.timestamp('dueDate').notNullable();
    t.timestamp('paidDate');
    t.timestamp('periodStart').notNullable();
    t.timestamp('periodEnd').notNullable();
    t.uuid('orderPaymentId').references('orderPaymentId').inTable('orderPayment');
    t.string('invoiceNumber', 50);
    t.text('invoiceUrl');
    t.jsonb('items').notNullable();
    t.decimal('subtotal', 15, 2).notNullable();
    t.decimal('tax', 15, 2).notNullable().defaultTo(0);
    t.decimal('discount', 15, 2).notNullable().defaultTo(0);
    t.string('gatewayInvoiceId', 255);

    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deletedAt');

    t.index('paymentSubscriptionId');
    t.index('customerId');
    t.index('merchantId');
    t.index('status');
    t.index('dueDate');
    t.index('orderPaymentId');
    t.index('invoiceNumber');
    t.index('gatewayInvoiceId');
    t.index('deletedAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('subscriptionInvoice');
};
