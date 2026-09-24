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

  // Stored payment method for testcustomer@example.com — used by
  // paymentOps tests (set default method)
  const OPS_STORED_METHOD_ID = '00000000-0000-0000-0000-000000008001';
  const hasStoredMethod = await knex.schema.hasTable('storedPaymentMethod');
  if (hasStoredMethod) {
    const testCustomer = await knex('customer')
      .where({ email: 'testcustomer@example.com' })
      .first('customerId');
    if (testCustomer) {
      await knex('storedPaymentMethod').where({ storedPaymentMethodId: OPS_STORED_METHOD_ID }).del();
      await knex('storedPaymentMethod').insert({
        storedPaymentMethodId: OPS_STORED_METHOD_ID,
        customerId: testCustomer.customerId,
        paymentMethod: 'creditCard',
        provider: 'stripe',
        token: 'tok_ops_seeded',
        lastFour: '4242',
        cardType: 'visa',
        expiryMonth: '12',
        expiryYear: '2030',
        isDefault: false,
        isExpired: false,
        createdAt: knex.fn.now(),
        updatedAt: knex.fn.now(),
      });
    }
  }

  const TEST_GATEWAY_ID = '00000000-0000-0000-0000-000000008100';
  const TEST_METHOD_CONFIG_ID = '00000000-0000-0000-0000-000000008101';

  // Clean up existing test data
  await knex('paymentMethodConfig').where({ organizationId }).del();
  await knex('paymentGateway').where({ organizationId }).del();

  // Insert test payment gateway
  const [gateway] = await knex('paymentGateway')
    .insert({
      paymentGatewayId: TEST_GATEWAY_ID,
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
      paymentMethodConfigId: TEST_METHOD_CONFIG_ID,
      organizationId,
      paymentMethod: 'creditCard',
      isEnabled: true,
      displayName: 'Credit Card',
      description: 'Pay with Visa, Mastercard, or American Express',
      processingFeeCents: 290,
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
      processingFeeCents: 150,
      displayOrder: 2,
      supportedCurrencies: ['USD'],
      gatewayId,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
