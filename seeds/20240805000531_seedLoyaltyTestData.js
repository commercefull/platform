/**
 * Seed Loyalty Test Data
 *
 * Creates test tiers and rewards for integration testing.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Delete existing test data
  await knex('loyaltyRedemption').del();
  await knex('loyaltyTransaction').del();
  await knex('loyaltyPoints').del();
  await knex('loyaltyReward').del();
  await knex('loyaltyTier').del();

  // Insert loyalty tiers
  await knex('loyaltyTier').insert([
    {
      name: 'Bronze',
      description: 'Entry level tier',
      level: 1,
      pointsThreshold: 0,
      pointsMultiplier: 1.0,
      benefits: JSON.stringify(['Basic rewards access']),
      isActive: true,
    },
    {
      name: 'Silver',
      description: 'Silver tier with bonus multiplier',
      level: 2,
      pointsThreshold: 500,
      pointsMultiplier: 1.25,
      benefits: JSON.stringify(['10% bonus points', 'Early access to sales']),
      isActive: true,
    },
    {
      name: 'Gold',
      description: 'Gold tier with premium benefits',
      level: 3,
      pointsThreshold: 2000,
      pointsMultiplier: 1.5,
      benefits: JSON.stringify(['25% bonus points', 'Free shipping', 'Exclusive rewards']),
      isActive: true,
    },
    {
      name: 'Platinum',
      description: 'Top tier with maximum benefits',
      level: 4,
      pointsThreshold: 5000,
      pointsMultiplier: 2.0,
      benefits: JSON.stringify(['Double points', 'Free express shipping', 'VIP support', 'Birthday bonus']),
      isActive: true,
    },
  ]);

  // Insert loyalty rewards
  await knex('loyaltyReward').insert([
    {
      name: '$5 Off',
      description: 'Get $5 off your next purchase',
      type: 'discount',
      pointsCost: 500,
      value: 5.0,
      valueType: 'fixed',
      isActive: true,
    },
    {
      name: '$10 Off',
      description: 'Get $10 off your next purchase',
      type: 'discount',
      pointsCost: 900,
      value: 10.0,
      valueType: 'fixed',
      isActive: true,
    },
    {
      name: 'Free Shipping',
      description: 'Free shipping on your next order',
      type: 'free_shipping',
      pointsCost: 300,
      value: null,
      valueType: null,
      isActive: true,
    },
    {
      name: '15% Off',
      description: 'Get 15% off your entire order',
      type: 'discount',
      pointsCost: 1500,
      value: 15.0,
      valueType: 'percentage',
      isActive: true,
    },
  ]);
};
