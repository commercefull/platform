import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805001700_seedSubscriptionTestData.js
export const SEEDED_SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY_BOX: '01937000-0000-7000-8000-000000000001',
  WEEKLY_DELIVERY: '01937000-0000-7000-8000-000000000002',
  ANNUAL_MEMBERSHIP: '01937000-0000-7000-8000-000000000003'
};

export const SEEDED_SUBSCRIPTION_PLAN_IDS = {
  MONTHLY_BOX_BASIC: '01937001-0000-7000-8000-000000000001',
  MONTHLY_BOX_PREMIUM: '01937001-0000-7000-8000-000000000002',
  WEEKLY_DELIVERY_STANDARD: '01937001-0000-7000-8000-000000000003',
  ANNUAL_MEMBERSHIP_BASIC: '01937001-0000-7000-8000-000000000004',
  ANNUAL_MEMBERSHIP_VIP: '01937001-0000-7000-8000-000000000005'
};

export const SEEDED_CUSTOMER_SUBSCRIPTION_IDS = {
  ACTIVE_MONTHLY: '01937002-0000-7000-8000-000000000001',
  PAUSED_WEEKLY: '01937002-0000-7000-8000-000000000002',
  CANCELLED_ANNUAL: '01937002-0000-7000-8000-000000000003'
};

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

const customerCredentials = {
  email: 'customer@example.com',
  password: 'password123'
};

export function createTestClient(): AxiosInstance {
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    }
  });
}

export async function setupSubscriptionTests() {
  const client = createTestClient();

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = adminLoginResponse.data.accessToken;

  const customerLoginResponse = await client.post('/api/auth/login', customerCredentials);
  const customerToken = customerLoginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token for Subscription tests');
  }

  return { client, adminToken, customerToken: customerToken || '' };
}

export function createTestSubscriptionProduct(productId: string, overrides: Partial<any> = {}) {
  return {
    productId,
    isSubscriptionOnly: false,
    allowOneTimePurchase: true,
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
    isActive: true,
    ...overrides
  };
}

export function createTestSubscriptionPlan(subscriptionProductId: string, overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    subscriptionProductId,
    name: `Test Plan ${timestamp}`,
    slug: `test-plan-${timestamp}`,
    description: 'Integration test subscription plan',
    billingInterval: 'month',
    billingIntervalCount: 1,
    price: 29.99,
    currency: 'USD',
    setupFee: 0,
    trialDays: 14,
    isContractRequired: false,
    discountPercent: 0,
    discountAmount: 0,
    includesFreeShipping: false,
    features: ['Feature 1', 'Feature 2'],
    sortOrder: 0,
    isPopular: false,
    isActive: true,
    ...overrides
  };
}

export function createTestCustomerSubscription(
  customerId: string,
  subscriptionPlanId: string,
  subscriptionProductId: string,
  overrides: Partial<any> = {}
) {
  return {
    customerId,
    subscriptionPlanId,
    subscriptionProductId,
    quantity: 1,
    unitPrice: 29.99,
    discountAmount: 0,
    taxAmount: 2.40,
    totalPrice: 32.39,
    currency: 'USD',
    billingInterval: 'month',
    billingIntervalCount: 1,
    ...overrides
  };
}

export async function cleanupSubscriptionTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { 
    productIds?: string[]; 
    planIds?: string[]; 
    subscriptionIds?: string[] 
  } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  // Cancel subscriptions first
  for (const id of resources.subscriptionIds || []) {
    try {
      await client.post(`/business/subscriptions/subscriptions/${id}/cancel`, {}, { headers });
    } catch (error) {}
  }

  // Delete plans (they cascade from products, but try anyway)
  for (const id of resources.planIds || []) {
    try {
      await client.delete(`/business/subscriptions/plans/${id}`, { headers });
    } catch (error) {}
  }

  // Delete products
  for (const id of resources.productIds || []) {
    try {
      await client.delete(`/business/subscriptions/products/${id}`, { headers });
    } catch (error) {}
  }
}
