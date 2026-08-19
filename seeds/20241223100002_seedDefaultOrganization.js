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
};
