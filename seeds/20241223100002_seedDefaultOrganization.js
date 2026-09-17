/**
 * Seed Default Organization
 * Creates the default organization record
 */

exports.seed = async function (knex) {
  const existingOrg = await knex('organization').where('slug', 'default').first();

  if (!existingOrg) {
    await knex('organization').insert({
      name: 'Default Organization',
      slug: 'default',
      type: 'single',
      email: 'default@organization.local',
      password: '$2b$10$placeholderNotUsedForLogin',
      status: 'active',
      verificationStatus: 'verified',
      settings: JSON.stringify({}),
    });
  }

  // Organization with no payment info — used by organization ops integration
  // tests so POST /payment-info is deterministic (201 then 409 on duplicate).
  const OPS_ORG_ID = '0191d000-0000-7000-8000-000000000001';
  await knex('organizationPaymentInfo').where('organizationId', OPS_ORG_ID).del();
  await knex('organization').where('organizationId', OPS_ORG_ID).del();
  await knex('organization').insert({
    organizationId: OPS_ORG_ID,
    name: 'Ops Payment Info Org',
    slug: 'ops-payment-info-org',
    email: 'ops-payment-info@example.com',
    password: '$2b$10$placeholderNotUsedForLogin',
    status: 'active',
    verificationStatus: 'verified',
    settings: JSON.stringify({}),
  });
};
