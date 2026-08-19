/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const TEST_MERCHANT_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  await knex.transaction(async trx => {
    // Delete child records first to satisfy FK constraints
    await trx('product').where('organizationId', TEST_MERCHANT_ID).del();
    await trx('distributionWarehouse').where('organizationId', TEST_MERCHANT_ID).del();
    await trx('distributionWarehouse').whereNotNull('storeId').update({ storeId: null });
    await trx('storeHierarchy').where('organizationId', TEST_MERCHANT_ID).del();
    await trx('store').where('organizationId', TEST_MERCHANT_ID).del();
    await trx('organizationAddress').where('organizationId', TEST_MERCHANT_ID).del();
    await trx('organization').where('organizationId', TEST_MERCHANT_ID).del();

    // Also cleanup by slug just in case
    const organizationIds = await trx('organization').select('organizationId').where({ slug: 'sample-merchant' });

    if (organizationIds.length > 0) {
      const ids = organizationIds.map(m => m.organizationId);
      await trx('product').whereIn('organizationId', ids).del();
      await trx('distributionWarehouse').whereIn('organizationId', ids).del();
      await trx('distributionWarehouse').whereNotNull('storeId').update({ storeId: null });
      await trx('storeHierarchy').whereIn('organizationId', ids).del();
      await trx('store').whereIn('organizationId', ids).del();
      await trx('organizationAddress').whereIn('organizationId', ids).del();
      await trx('organization').whereIn('organizationId', ids).del();
    }

    const [inserted] = await trx('organization')
      .insert({
        organizationId: TEST_MERCHANT_ID,
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
      })
      .returning(['organizationId']);

    const organizationId = inserted?.organizationId ?? inserted ?? TEST_MERCHANT_ID;

    await trx('organizationAddress').insert({
      organizationId,
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
  });
};
