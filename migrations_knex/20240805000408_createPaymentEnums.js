exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "paymentMethodType" AS ENUM (
      'creditCard',
      'debitCard',
      'paypal',
      'applePay',
      'googlePay',
      'bankTransfer',
      'giftCard',
      'storeCredit',
      'crypto',
      'cashOnDelivery',
      'affirm',
      'klarna',
      'afterpay',
      'other'
    );
    CREATE TYPE "paymentProvider" AS ENUM (
      'stripe',
      'paypal',
      'braintree',
      'adyen',
      'square',
      'authorizeNet',
      'worldpay',
      'internal',
      'manual',
      'other'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE "paymentMethodType";
    DROP TYPE "paymentProvider";
  `);
};
