import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

const customerCredentials = {
  email: 'customer@example.com',
  password: 'password123'
};

export async function setupSupportTests() {
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data.accessToken;

  const customerLoginResponse = await client.post('/business/auth/login', customerCredentials);
  const customerToken = customerLoginResponse.data.accessToken;

  if (!adminToken || !customerToken) {
    throw new Error('Failed to get tokens for Support tests');
  }

  return { client, adminToken, customerToken };
}

export function createTestTicket(overrides: Partial<any> = {}) {
  return {
    subject: `Test Ticket ${Date.now()}`,
    message: 'This is a test support ticket for integration testing.',
    category: 'general',
    priority: 'medium',
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
