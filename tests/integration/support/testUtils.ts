import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805001900_seedSupportTestData.js
export const SEEDED_SUPPORT_AGENT_IDS = {
  AGENT_JOHN: '01939000-0000-7000-8000-000000000001',
  AGENT_JANE: '01939000-0000-7000-8000-000000000002',
  SUPERVISOR_BOB: '01939000-0000-7000-8000-000000000003'
};

export const SEEDED_SUPPORT_TICKET_IDS = {
  TICKET_OPEN: '01939001-0000-7000-8000-000000000001',
  TICKET_IN_PROGRESS: '01939001-0000-7000-8000-000000000002',
  TICKET_RESOLVED: '01939001-0000-7000-8000-000000000003'
};

export const SEEDED_FAQ_CATEGORY_IDS = {
  ORDERS: '01939003-0000-7000-8000-000000000001',
  SHIPPING: '01939003-0000-7000-8000-000000000002',
  RETURNS: '01939003-0000-7000-8000-000000000003'
};

export const SEEDED_FAQ_ARTICLE_IDS = {
  HOW_TO_ORDER: '01939004-0000-7000-8000-000000000001',
  SHIPPING_TIMES: '01939004-0000-7000-8000-000000000002',
  RETURN_POLICY: '01939004-0000-7000-8000-000000000003'
};

export const SEEDED_STOCK_ALERT_IDS = {
  ALERT_1: '01939005-0000-7000-8000-000000000001',
  ALERT_2: '01939005-0000-7000-8000-000000000002'
};

export const SEEDED_PRICE_ALERT_IDS = {
  ALERT_1: '01939006-0000-7000-8000-000000000001',
  ALERT_2: '01939006-0000-7000-8000-000000000002'
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

export async function setupSupportTests() {
  const client = createTestClient();
  let adminToken = '';
  let customerToken = '';

  try {
    const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
    adminToken = adminLoginResponse.data?.accessToken || '';

    const customerLoginResponse = await client.post('/customer/identity/login', customerCredentials, { headers: { 'X-Test-Request': 'true' } });
    customerToken = customerLoginResponse.data?.accessToken || '';

    if (!adminToken) {
      
    }
    if (!customerToken) {
      
    }
  } catch (error) {
    
  }

  return { client, adminToken, customerToken };
}

export function createTestTicket(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    subject: `Test Ticket ${timestamp}`,
    description: 'This is a test support ticket for integration testing.',
    email: 'test@example.com',
    name: 'Test User',
    category: 'other',
    priority: 'medium',
    channel: 'web',
    ...overrides
  };
}

export function createTestAgent(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    email: `agent-${timestamp}@example.com`,
    firstName: 'Test',
    lastName: 'Agent',
    displayName: 'Test A.',
    role: 'agent',
    department: 'Customer Service',
    isActive: true,
    isAvailable: true,
    maxTickets: 20,
    timezone: 'UTC',
    ...overrides
  };
}

export function createTestFaqCategory(overrides: Partial<any> = {}) {
  return {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    description: 'Integration test FAQ category',
    sortOrder: 1,
    ...overrides
  };
}

export function createTestFaqArticle(categoryId: string, overrides: Partial<any> = {}) {
  return {
    title: `Test Article ${Date.now()}`,
    slug: `test-article-${Date.now()}`,
    content: 'This is test FAQ content for integration testing.',
    categoryId,
    tags: ['test', 'integration'],
    ...overrides
  };
}

export async function cleanupSupportTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { ticketIds?: string[]; categoryIds?: string[]; articleIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.articleIds || []) {
    try {
      await client.delete(`/business/support/faq/articles/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.categoryIds || []) {
    try {
      await client.delete(`/business/support/faq/categories/${id}`, { headers });
    } catch (error) {}
  }
}
