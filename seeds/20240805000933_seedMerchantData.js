/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    INSERT INTO "merchant" (
      name,
      slug,
      description,
      email,
      phone,
      password,
      website,
      status,
      "verificationStatus",
      "businessType",
      "commissionRate",
      "payoutSchedule"
    )
    VALUES (
      'Sample Merchant',
      'sample-merchant',
      'This is a sample merchant for demonstration purposes',
      'merchant@example.com',
      '555-123-4567',
      '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC',
      'https://example.com',
      'active',
      'verified',
      'llc',
      10.00,
      'monthly'
    )
  `);

  await knex.raw(`
    WITH sample_merchant AS (SELECT "merchantId" FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchantAddress" (
      "merchantId",
      "addressType",
      "isDefault",
      "firstName",
      "lastName",
      company,
      "addressLine1",
      city,
      state,
      "postalCode",
      country,
      phone,
      "isVerified"
    )
    VALUES (
      (SELECT "merchantId" FROM sample_merchant),
      'business',
      true,
      'John',
      'Doe',
      'Sample Merchant LLC',
      '123 Merchant St',
      'Anytown',
      'CA',
      '12345',
      'US',
      '555-123-4567',
      true
    )
  `);

  await knex.raw(`
    WITH sample_merchant AS (SELECT "merchantId" FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchantContact" (
      "merchantId",
      "firstName",
      "lastName",
      email,
      phone,
      "jobTitle",
      "isPrimary",
      department
    )
    VALUES (
      (SELECT "merchantId" FROM sample_merchant),
      'John',
      'Doe',
      'john.doe@example.com',
      '555-123-4567',
      'Owner',
      true,
      'general'
    )
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('merchantContact').where('email', 'john.doe@example.com').delete();
  await knex('merchantAddress').where('company', 'Sample Merchant LLC').delete();
  await knex('merchant').where('slug', 'sample-merchant').delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
