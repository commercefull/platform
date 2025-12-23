/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('paymentMethod', t => {
    t.uuid('paymentMethodId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.enum('type', ['creditCard', 'debitCard', 'paypal', 'applePay', 'googlePay', 'bankTransfer']).notNullable();
    t.string('provider', 100).notNullable();
    t.string('token', 255);
    t.string('gatewayCustomerId', 255);
    t.string('gatewayPaymentMethodId', 255);
    t.string('maskedNumber', 30);
    t.string('cardType', 50);
    t.integer('expiryMonth');
    t.integer('expiryYear');
    t.string('cardholderName', 255);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.uuid('billingAddressId').references('customerAddressId').inTable('customerAddress');

    t.index('customerId');
    t.index('type');
    t.index('provider');
    t.index('gatewayCustomerId');
    t.index('gatewayPaymentMethodId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('paymentMethod');
};
