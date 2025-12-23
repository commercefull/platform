/**
 * Seed customer loyalty program
 * @param { import('knex').Knex } knex
 */
exports.seed = async function (knex) {
  await knex('customerLoyaltyProgram').del();
  await knex('customerLoyaltyProgram').insert([
    {
      name: 'Reward Points',
      description: 'Standard loyalty program awarding points for purchases',
      isActive: true,
      pointsName: 'Points',
      pointsAbbreviation: 'pts',
      pointToValueRatio: 0.01,
      minimumRedemption: 500,
      redemptionMultiple: 100,
      enrollmentBonus: 200,
    },
  ]);
};
