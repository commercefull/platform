/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert sample merchant
  await knex('merchant').insert({
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
    commissionRate: 10.00,
    payoutSchedule: 'monthly'
  });

  const sampleMerchant = await knex('merchant').where({ slug: 'sample-merchant' }).first();

  if (sampleMerchant) {
    // Insert sample merchant address
    await knex('merchantAddress').insert({
      merchantId: sampleMerchant.id,
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

    // Insert sample merchant contact
    await knex('merchantContact').insert({
      merchantId: sampleMerchant.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      jobTitle: 'Owner',
      isPrimary: true,
      department: 'general'
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('merchant').where({ slug: 'sample-merchant' }).del();
};
