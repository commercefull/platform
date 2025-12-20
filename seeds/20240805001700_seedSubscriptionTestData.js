/**
 * Subscription Test Data Seed
 * Seeds test data for subscription integration tests
 */

// Fixed UUIDs for test data consistency
const SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY_BOX: '01937000-0000-7000-8000-000000000001',
  WEEKLY_DELIVERY: '01937000-0000-7000-8000-000000000002',
  ANNUAL_MEMBERSHIP: '01937000-0000-7000-8000-000000000003'
};

const SUBSCRIPTION_PLAN_IDS = {
  MONTHLY_BOX_BASIC: '01937001-0000-7000-8000-000000000001',
  MONTHLY_BOX_PREMIUM: '01937001-0000-7000-8000-000000000002',
  WEEKLY_DELIVERY_STANDARD: '01937001-0000-7000-8000-000000000003',
  ANNUAL_MEMBERSHIP_BASIC: '01937001-0000-7000-8000-000000000004',
  ANNUAL_MEMBERSHIP_VIP: '01937001-0000-7000-8000-000000000005'
};

const CUSTOMER_SUBSCRIPTION_IDS = {
  ACTIVE_MONTHLY: '01937002-0000-7000-8000-000000000001',
  PAUSED_WEEKLY: '01937002-0000-7000-8000-000000000002',
  CANCELLED_ANNUAL: '01937002-0000-7000-8000-000000000003'
};

// We need a product ID - use a fixed one that should exist from product seeds
const TEST_PRODUCT_ID = '01912000-0000-7000-8000-000000000001';
const TEST_CUSTOMER_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function(knex) {
  // Check if test product exists, if not skip seeding
  const productExists = await knex('product').where('productId', TEST_PRODUCT_ID).first();
  
  if (!productExists) {
    console.log('Skipping subscription seed - test product does not exist (productId:', TEST_PRODUCT_ID, ')');
    return;
  }
  
  // Clean up existing test data
  await knex('subscriptionPause').whereIn('customerSubscriptionId', Object.values(CUSTOMER_SUBSCRIPTION_IDS)).del();
  await knex('subscriptionOrder').whereIn('customerSubscriptionId', Object.values(CUSTOMER_SUBSCRIPTION_IDS)).del();
  await knex('customerSubscription').whereIn('customerSubscriptionId', Object.values(CUSTOMER_SUBSCRIPTION_IDS)).del();
  await knex('subscriptionPlan').whereIn('subscriptionPlanId', Object.values(SUBSCRIPTION_PLAN_IDS)).del();
  await knex('subscriptionProduct').whereIn('subscriptionProductId', Object.values(SUBSCRIPTION_PRODUCT_IDS)).del();

  // Seed Subscription Products with existence checks
  for (const [key, subProductId] of Object.entries(SUBSCRIPTION_PRODUCT_IDS)) {
    const existingSubProduct = await knex('subscriptionProduct')
      .where('subscriptionProductId', subProductId)
      .first();

    if (!existingSubProduct) {
      let productData;
      if (key === 'MONTHLY_BOX') {
        productData = {
          subscriptionProductId: subProductId,
          productId: TEST_PRODUCT_ID,
          isSubscriptionOnly: false,
          allowOneTimePurchase: true,
          minSubscriptionLength: 1,
          maxSubscriptionLength: 24,
          trialDays: 14,
          trialRequiresPayment: false,
          billingAnchor: 'subscription_start',
          prorateOnChange: true,
          allowPause: true,
          maxPauseDays: 30,
          maxPausesPerYear: 2,
          allowSkip: true,
          maxSkipsPerYear: 3,
          allowEarlyCancel: true,
          cancelNoticeDays: 0,
          autoRenew: true,
          renewalReminderDays: 7,
          isActive: true
        };
      } else if (key === 'WEEKLY_DELIVERY') {
        productData = {
          subscriptionProductId: subProductId,
          productId: TEST_PRODUCT_ID,
          isSubscriptionOnly: true,
          allowOneTimePurchase: false,
          minSubscriptionLength: 4,
          trialDays: 7,
          trialRequiresPayment: true,
          billingAnchor: 'subscription_start',
          prorateOnChange: true,
          allowPause: true,
          maxPauseDays: 14,
          maxPausesPerYear: 4,
          allowSkip: true,
          maxSkipsPerYear: 6,
          allowEarlyCancel: true,
          cancelNoticeDays: 7,
          autoRenew: true,
          renewalReminderDays: 3,
          isActive: true
        };
      } else if (key === 'ANNUAL_MEMBERSHIP') {
        productData = {
          subscriptionProductId: subProductId,
          productId: TEST_PRODUCT_ID,
          isSubscriptionOnly: true,
          allowOneTimePurchase: false,
          minSubscriptionLength: 12,
          trialDays: 30,
          trialRequiresPayment: false,
          billingAnchor: 'month_start',
          prorateOnChange: false,
          allowPause: false,
          allowSkip: false,
          allowEarlyCancel: true,
          cancelNoticeDays: 30,
          earlyTerminationFee: 50.00,
          autoRenew: true,
          renewalReminderDays: 30,
          isActive: true
        };
      }

      await knex('subscriptionProduct').insert(productData);
    }
  }

  // Seed Subscription Plans with existence checks
  const plansToInsert = [];
  for (const [key, planId] of Object.entries(SUBSCRIPTION_PLAN_IDS)) {
    const existingPlan = await knex('subscriptionPlan')
      .where('subscriptionPlanId', planId)
      .first();

    if (!existingPlan) {
      let planData;
      if (key === 'MONTHLY_BOX_BASIC') {
        planData = {
          subscriptionPlanId: planId,
          subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX,
          name: 'Basic Monthly Box',
          slug: 'basic-monthly-box',
          description: 'Our entry-level monthly subscription box',
          billingInterval: 'month',
          billingIntervalCount: 1,
          price: 29.99,
          compareAtPrice: 39.99,
          currency: 'USD',
          setupFee: 0,
          trialDays: 14,
          isContractRequired: false,
          discountPercent: 0,
          discountAmount: 0,
          includesFreeShipping: false,
          features: JSON.stringify(['5 items per box', 'Free returns', 'Cancel anytime']),
          sortOrder: 1,
          isPopular: false,
          isActive: true
        };
      } else if (key === 'MONTHLY_BOX_PREMIUM') {
        planData = {
          subscriptionPlanId: planId,
          subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX,
          name: 'Premium Monthly Box',
          slug: 'premium-monthly-box',
          description: 'Our premium monthly subscription with extra perks',
          billingInterval: 'month',
          billingIntervalCount: 1,
          price: 49.99,
          compareAtPrice: 69.99,
          currency: 'USD',
          setupFee: 0,
          trialDays: 14,
          isContractRequired: false,
          discountPercent: 10,
          discountAmount: 0,
          includesFreeShipping: true,
          features: JSON.stringify(['10 items per box', 'Free shipping', 'Priority support', 'Exclusive items']),
          sortOrder: 2,
          isPopular: true,
          isActive: true
        };
      } else if (key === 'WEEKLY_DELIVERY_STANDARD') {
        planData = {
          subscriptionPlanId: planId,
          subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.WEEKLY_DELIVERY,
          name: 'Weekly Delivery',
          slug: 'weekly-delivery',
          description: 'Fresh products delivered every week',
          billingInterval: 'week',
          billingIntervalCount: 1,
          price: 19.99,
          currency: 'USD',
          setupFee: 5.00,
          trialDays: 7,
          contractLength: 4,
          isContractRequired: true,
          discountPercent: 0,
          discountAmount: 0,
          includesFreeShipping: true,
          features: JSON.stringify(['Weekly delivery', 'Fresh products', 'Flexible scheduling']),
          sortOrder: 1,
          isPopular: false,
          isActive: true
        };
      } else if (key === 'ANNUAL_MEMBERSHIP_BASIC') {
        planData = {
          subscriptionPlanId: planId,
          subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.ANNUAL_MEMBERSHIP,
          name: 'Annual Basic Membership',
          slug: 'annual-basic',
          description: 'Basic annual membership with core benefits',
          billingInterval: 'year',
          billingIntervalCount: 1,
          price: 99.99,
          compareAtPrice: 149.99,
          currency: 'USD',
          setupFee: 0,
          trialDays: 30,
          contractLength: 1,
          isContractRequired: true,
          discountPercent: 20,
          discountAmount: 0,
          includesFreeShipping: true,
          features: JSON.stringify(['All basic features', '20% discount on orders', 'Free shipping']),
          sortOrder: 1,
          isPopular: false,
          isActive: true
        };
      } else if (key === 'ANNUAL_MEMBERSHIP_VIP') {
        planData = {
          subscriptionPlanId: planId,
          subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.ANNUAL_MEMBERSHIP,
          name: 'Annual VIP Membership',
          slug: 'annual-vip',
          description: 'VIP annual membership with premium benefits',
          billingInterval: 'year',
          billingIntervalCount: 1,
          price: 199.99,
          compareAtPrice: 299.99,
          currency: 'USD',
          setupFee: 0,
          trialDays: 30,
          contractLength: 1,
          isContractRequired: true,
          discountPercent: 30,
          discountAmount: 0,
          includesFreeShipping: true,
          features: JSON.stringify(['All VIP features', '30% discount on orders', 'Free express shipping', 'Early access', 'Exclusive events']),
          sortOrder: 2,
          isPopular: true,
          isActive: true
        };
      }

      if (planData) {
        plansToInsert.push(planData);
      }
    }
  }

  if (plansToInsert.length > 0) {
    await knex('subscriptionPlan').insert(plansToInsert);
  }

  // Check if test customer exists before creating subscriptions
  const customerExists = await knex('customer').where('customerId', TEST_CUSTOMER_ID).first();
  
  if (customerExists) {
    // Seed Customer Subscriptions with existence checks
    const subscriptionsToInsert = [];
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    for (const [key, subId] of Object.entries(CUSTOMER_SUBSCRIPTION_IDS)) {
      const existingSubscription = await knex('customerSubscription')
        .where('customerSubscriptionId', subId)
        .first();

      if (!existingSubscription) {
        let subscriptionData;
        if (key === 'ACTIVE_MONTHLY') {
          subscriptionData = {
            customerSubscriptionId: subId,
            subscriptionNumber: 'SUB-TEST-001',
            customerId: TEST_CUSTOMER_ID,
            subscriptionPlanId: SUBSCRIPTION_PLAN_IDS.MONTHLY_BOX_PREMIUM,
            subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX,
            status: 'active',
            quantity: 1,
            unitPrice: 49.99,
            discountAmount: 0,
            taxAmount: 4.00,
            totalPrice: 53.99,
            currency: 'USD',
            billingInterval: 'month',
            billingIntervalCount: 1,
            currentPeriodStart: lastMonth,
            currentPeriodEnd: now,
            nextBillingAt: nextMonth,
            cancelAtPeriodEnd: false,
            pauseCount: 0,
            skipCount: 0,
            billingCycleCount: 3,
            lifetimeValue: 161.97,
            failedPaymentCount: 0
          };
        } else if (key === 'PAUSED_WEEKLY') {
          subscriptionData = {
            customerSubscriptionId: subId,
            subscriptionNumber: 'SUB-TEST-002',
            customerId: TEST_CUSTOMER_ID,
            subscriptionPlanId: SUBSCRIPTION_PLAN_IDS.WEEKLY_DELIVERY_STANDARD,
            subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.WEEKLY_DELIVERY,
            status: 'paused',
            quantity: 1,
            unitPrice: 19.99,
            discountAmount: 0,
            taxAmount: 1.60,
            totalPrice: 21.59,
            currency: 'USD',
            billingInterval: 'week',
            billingIntervalCount: 1,
            currentPeriodStart: lastMonth,
            currentPeriodEnd: now,
            pausedAt: now,
            pauseReason: 'vacation',
            cancelAtPeriodEnd: false,
            pauseCount: 1,
            skipCount: 0,
            billingCycleCount: 8,
            lifetimeValue: 172.72,
            failedPaymentCount: 0
          };
        } else if (key === 'CANCELLED_ANNUAL') {
          subscriptionData = {
            customerSubscriptionId: subId,
            subscriptionNumber: 'SUB-TEST-003',
            customerId: TEST_CUSTOMER_ID,
            subscriptionPlanId: SUBSCRIPTION_PLAN_IDS.ANNUAL_MEMBERSHIP_BASIC,
            subscriptionProductId: SUBSCRIPTION_PRODUCT_IDS.ANNUAL_MEMBERSHIP,
            status: 'cancelled',
            quantity: 1,
            unitPrice: 99.99,
            discountAmount: 0,
            taxAmount: 8.00,
            totalPrice: 107.99,
            currency: 'USD',
            billingInterval: 'year',
            billingIntervalCount: 1,
            currentPeriodStart: lastMonth,
            currentPeriodEnd: nextMonth,
            cancelledAt: now,
            cancellationReason: 'too_expensive',
            cancelledBy: 'customer',
            cancelAtPeriodEnd: true,
            pauseCount: 0,
            skipCount: 0,
            billingCycleCount: 1,
            lifetimeValue: 107.99,
            failedPaymentCount: 0
          };
        }

        if (subscriptionData) {
          subscriptionsToInsert.push(subscriptionData);
        }
      }
    }

    if (subscriptionsToInsert.length > 0) {
      await knex('customerSubscription').insert(subscriptionsToInsert);
    }

    console.log('Subscription test data seeded successfully');
  } else {
    console.log('Subscription products and plans seeded (no customer subscriptions - test customer not found)');
  }
};
