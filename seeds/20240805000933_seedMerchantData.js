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
      verification_status,
      business_type,
      commission_rate,
      payout_schedule
    )
    VALUES (
      'Sample Merchant',
      'sample-merchant',
      'This is a sample merchant for demonstration purposes',
      'merchant@example.com',
      '555-123-4567',
      '$2a$10$Rnq.K1xbkBJ9JJ5L2FTK9.HXcT5gn97JOH6yEMBFMfRK.Mz9dUDty', -- "password123" hashed with bcrypt
      'https://example.com',
      'active',
      'verified',
      'llc',
      10.00,
      'monthly'
    )
  `);

  await knex.raw(`
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_address" (
      merchant_id,
      address_type,
      is_default,
      first_name,
      last_name,
      company,
      address_line_1,
      city,
      state,
      postal_code,
      country,
      phone,
      is_verified
    )
    VALUES (
      (SELECT id FROM sample_merchant),
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
    WITH sample_merchant AS (SELECT id FROM merchant WHERE slug = 'sample-merchant')
    INSERT INTO "merchant_contact" (
      merchant_id,
      first_name,
      last_name,
      email,
      phone,
      job_title,
      is_primary,
      department
    )
    VALUES (
      (SELECT id FROM sample_merchant),
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
  await knex('merchant_contact').where('email', 'john.doe@example.com').delete();
  await knex('merchant_address').where('company', 'Sample Merchant LLC').delete();
  await knex('merchant').where('slug', 'sample-merchant').delete();
};
