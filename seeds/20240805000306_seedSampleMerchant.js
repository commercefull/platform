/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex.transaction(async trx => {
    const merchantIds = trx('merchant')
      .select('merchantId')
      .where({ slug: 'sample-merchant' });

    await trx('merchantContact').whereIn('merchantId', merchantIds).del();
    await trx('merchantAddress').whereIn('merchantId', merchantIds).del();
    await trx('merchant').where({ slug: 'sample-merchant' }).del();

    const [inserted] = await trx('merchant')
      .insert({
        name: 'Sample Merchant',
        slug: 'sample-merchant',
        description: 'This is a sample merchant for demonstration purposes',
        email: 'merchant@example.com',
        phone: '555-123-4567',
        password: '$2a$10$Rnq.K1xbkBJ9JJ5L2FTK9.HXcT5gn97JOH6yEMBFMfRK.Mz9dUDty', // "password123"
        website: 'https://example.com',
        status: 'active',
        verificationStatus: 'verified',
        businessType: 'llc',
        commissionRate: 10.0,
        payoutSchedule: 'monthly'
      })
      .returning(['merchantId']);

    const merchantId = inserted?.merchantId ?? inserted;

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
      isVerified: true
    });

    await trx('merchantContact').insert({
      merchantId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      jobTitle: 'Owner',
      isPrimary: true,
      department: 'general'
    });
  });
};
