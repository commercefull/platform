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
      password: '$scrypt$N=16384,r=8,p=1$kRnfoZQDkf8xTlQHtV6E3w==$kpu+7kCRL0AZcSsI9o3WMyN4MO1YzoEkuVfJarVb3u87f5GKy8wepVRYpyJttj6k7bAGRszSjn3kWQs+kaI91Q==',
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
    password: '$scrypt$N=16384,r=8,p=1$kRnfoZQDkf8xTlQHtV6E3w==$kpu+7kCRL0AZcSsI9o3WMyN4MO1YzoEkuVfJarVb3u87f5GKy8wepVRYpyJttj6k7bAGRszSjn3kWQs+kaI91Q==',
    status: 'active',
    verificationStatus: 'verified',
    settings: JSON.stringify({}),
  });
};
