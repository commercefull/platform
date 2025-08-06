/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('paymentMethod', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customerId').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.enum('type', [
      'credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'
    ]).notNullable();
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
    t.uuid('billingAddressId').references('id').inTable('customerAddress');
    t.jsonb('metaData');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
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
