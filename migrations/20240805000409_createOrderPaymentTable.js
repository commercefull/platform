exports.up = function(knex) {
  return knex.schema.createTable('orderPayment', t => {
    t.uuid('orderPaymentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.decimal('amount', 15, 2).notNullable();
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.enum('paymentMethod', ['creditCard', 'debitCard', 'paypal', 'applePay', 'googlePay', 'bankTransfer', 'crypto', 'giftCard', 'storeCredit']).notNullable();
    t.enum('provider', ['stripe', 'square', 'braintree', 'adyen', 'cybersource', 'authorizenet', 'payflow', 'worldpay', 'adyen', 'cybersource', 'authorizenet', 'payflow', 'worldpay']).notNullable();
    t.enum('status', ['pending', 'authorized', 'captured', 'refunded', 'partiallyRefunded', 'voided', 'failed']).notNullable().defaultTo('pending');
    t.string('transactionId', 255);
    t.string('authorizationCode', 255);
    t.string('lastFour', 4);
    t.string('cardType', 50);
    t.string('cardholderName', 255);
    t.string('expiryMonth', 2);
    t.string('expiryYear', 4);
    t.string('billingPostalCode', 20);
    t.uuid('billingAddressId').references('customerAddressId').inTable('customerAddress');
    t.jsonb('billingAddress');
    t.string('paymentIntentId', 255);
    t.string('paymentMethodId', 255);
    t.string('customerPaymentProfileId', 255);
    t.string('errorCode', 100);
    t.text('errorMessage');
    t.text('receiptUrl');
    
    t.timestamp('capturedAt');
    t.timestamp('refundedAt');
    t.timestamp('voidedAt');

    t.index('orderId');
    t.index('paymentMethod');
    t.index('provider');
    t.index('status');
    t.index('transactionId');
    t.index('billingAddressId');
    t.index('paymentIntentId');
    t.index('paymentMethodId');
    t.index('customerPaymentProfileId');
    t.index('capturedAt');
    t.index('refundedAt');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderPayment');
};
