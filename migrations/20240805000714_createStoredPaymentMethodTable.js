exports.up = function(knex) {
  return knex.schema.createTable('storedPaymentMethod', t => {
    t.uuid('storedPaymentMethodId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('nickname', 255);
    t.enum('paymentMethod', ['creditCard', 'debitCard', 'paypal', 'applePay', 'googlePay', 'bankTransfer']).notNullable();
    t.enum('provider', ['stripe', 'square', 'braintree', 'adyen', 'cybersource', 'authorizenet']).notNullable();
    t.string('token', 255).notNullable();
    t.string('lastFour', 4);
    t.string('cardType', 50);
    t.string('expiryMonth', 2);
    t.string('expiryYear', 4);
    t.string('cardholderName', 255);
    t.uuid('customerAddressId').references('customerAddressId').inTable('customerAddress');
    t.jsonb('billingAddress');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isExpired').notNullable().defaultTo(false);
    t.string('customerPaymentProfileId', 255);
    

    t.index('customerId');
    t.index('paymentMethod');
    t.index('provider');
    t.index('token');
    t.index('isDefault');
    t.index('isExpired');
    t.index('customerPaymentProfileId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('storedPaymentMethod');
};
