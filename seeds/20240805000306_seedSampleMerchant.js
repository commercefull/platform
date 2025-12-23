/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_MERCHANT_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  await knex.transaction(async trx => {
    // Delete by ID if exists, or by slug
    await trx('merchantContact').where('merchantId', TEST_MERCHANT_ID).del();
    await trx('merchantAddress').where('merchantId', TEST_MERCHANT_ID).del();
    await trx('merchant').where('merchantId', TEST_MERCHANT_ID).del();

    // Also cleanup by slug just in case
    const merchantIds = await trx('merchant').select('merchantId').where({ slug: 'sample-merchant' });

    if (merchantIds.length > 0) {
      const ids = merchantIds.map(m => m.merchantId);
      await trx('merchantContact').whereIn('merchantId', ids).del();
      await trx('merchantAddress').whereIn('merchantId', ids).del();
      await trx('merchant').whereIn('merchantId', ids).del();
    }

    const [inserted] = await trx('merchant')
      .insert({
        merchantId: TEST_MERCHANT_ID,
        name: 'Sample Merchant',
        slug: 'sample-merchant',
        description: 'This is a sample merchant for demonstration purposes',
        email: 'merchant@example.com',
        phone: '555-123-4567',
        password: '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC', // "password123"
        website: 'https://example.com',
        status: 'active',
        verificationStatus: 'verified',
        businessType: 'llc',
        commissionRate: 10.0,
        payoutSchedule: 'monthly',
      })
      .returning(['merchantId']);

    const merchantId = inserted?.merchantId ?? inserted ?? TEST_MERCHANT_ID;

    await trx('merchantAddress').insert({
      merchantId,
      addressType: 'business',
      isDefault: true,
      firstName: 'John',
      lastName: 'Doe',
      company: 'Sample Merchant LLC',
      addressLine1: '123 Merchant St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
      isVerified: true,
    });

    await trx('merchantContact').insert({
      merchantId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      jobTitle: 'Owner',
      isPrimary: true,
      department: 'general',
    });
  });
};
