/**
 * Seed payment test data for integration tests
 */

exports.seed = async function (knex) {
  // Get the test merchant
  const testMerchant = await knex('organization').where({ email: 'merchant@example.com' }).first('organizationId');

  if (!testMerchant) {
    return;
  }

  const organizationId = testMerchant.organizationId;

  // Clean up existing test data
  await knex('paymentMethodConfig').where({ organizationId }).del();
  await knex('paymentGateway').where({ organizationId }).del();

  // Insert test payment gateway
  const [gateway] = await knex('paymentGateway')
    .insert({
      organizationId,
      name: 'Test Stripe Gateway',
      provider: 'stripe',
      isActive: true,
      isDefault: true,
      isTestMode: true,
      apiKey: 'sk_test_xxx',
      apiSecret: 'whsec_xxx',
      publicKey: 'pk_test_xxx',
      supportedPaymentMethods: 'creditCard',
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    })
    .returning('paymentGatewayId');

  const gatewayId = gateway.paymentGatewayId;

  // Insert test payment method configs
  await knex('paymentMethodConfig').insert([
    {
      organizationId,
      paymentMethod: 'creditCard',
      isEnabled: true,
      displayName: 'Credit Card',
      description: 'Pay with Visa, Mastercard, or American Express',
      processingFee: 2.9,
      displayOrder: 1,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      gatewayId,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      organizationId,
      paymentMethod: 'debitCard',
      isEnabled: true,
      displayName: 'Debit Card',
      description: 'Pay with your debit card',
      processingFee: 1.5,
      displayOrder: 2,
      supportedCurrencies: ['USD'],
      gatewayId,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
