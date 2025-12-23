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
      type: 'points',
      pointsThreshold: 0,
      multiplier: 1.0,
      benefits: JSON.stringify(['Basic rewards access']),
      isActive: true
    },
    {
      name: 'Silver',
      description: 'Silver tier with bonus multiplier',
      type: 'points',
      pointsThreshold: 500,
      multiplier: 1.25,
      benefits: JSON.stringify(['10% bonus points', 'Early access to sales']),
      isActive: true
    },
    {
      name: 'Gold',
      description: 'Gold tier with premium benefits',
      type: 'points',
      pointsThreshold: 2000,
      multiplier: 1.5,
      benefits: JSON.stringify(['25% bonus points', 'Free shipping', 'Exclusive rewards']),
      isActive: true
    },
    {
      name: 'Platinum',
      description: 'Top tier with maximum benefits',
      type: 'points',
      pointsThreshold: 5000,
      multiplier: 2.0,
      benefits: JSON.stringify(['Double points', 'Free express shipping', 'VIP support', 'Birthday bonus']),
      isActive: true
    }
  ]);

  // Insert loyalty rewards
  await knex('loyaltyReward').insert([
    {
      name: '$5 Off',
      description: 'Get $5 off your next purchase',
      pointsCost: 500,
      discountAmount: 5.00,
      discountPercent: null,
      discountCode: 'LOYALTY5',
      freeShipping: false,
      productIds: JSON.stringify([]),
      isActive: true
    },
    {
      name: '$10 Off',
      description: 'Get $10 off your next purchase',
      pointsCost: 900,
      discountAmount: 10.00,
      discountPercent: null,
      discountCode: 'LOYALTY10',
      freeShipping: false,
      productIds: JSON.stringify([]),
      isActive: true
    },
    {
      name: 'Free Shipping',
      description: 'Free shipping on your next order',
      pointsCost: 300,
      discountAmount: null,
      discountPercent: null,
      discountCode: 'LOYALTYSHIP',
      freeShipping: true,
      productIds: JSON.stringify([]),
      isActive: true
    },
    {
      name: '15% Off',
      description: 'Get 15% off your entire order',
      pointsCost: 1500,
      discountAmount: null,
      discountPercent: 15.00,
      discountCode: 'LOYALTY15PCT',
      freeShipping: false,
      productIds: JSON.stringify([]),
      isActive: true
    }
  ]);

  
};
