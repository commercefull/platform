/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    INSERT INTO "organization" (
      "organizationId",
      name,
      slug,
      description,
      email,
      phone,
      password,
      website,
      status,
      "verificationStatus",
      "businessType"
    )
    VALUES (
      '01911000-0000-7000-8000-000000000001',
      'Sample Merchant',
      'sample-merchant',
      'This is a sample merchant for demonstration purposes',
      'merchant@example.com',
      '555-123-4567',
      '$2b$10$wADyOBQwHwy0mz49WoGA.OcCrjAAXaYnMhsOrWWQ9FzUmXkrq6.aC',
      'https://example.com',
      'active',
      'verified',
      'llc'
    )
  `);

  await knex.raw(`
    WITH sample_org AS (SELECT "organizationId" FROM "organization" WHERE slug = 'sample-merchant')
    INSERT INTO "organizationAddress" (
      "organizationId",
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
      (SELECT "organizationId" FROM sample_org),
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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('organizationAddress').where('company', 'Sample Merchant LLC').delete();
  await knex('organization').where('slug', 'sample-merchant').delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
