import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export async function setupMarketingTests() {
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

  if (!adminToken) {
    throw new Error('Failed to get admin token for Marketing tests');
  }

  return { client, adminToken };
}

export function createTestCampaign(overrides: Partial<any> = {}) {
  return {
    name: `Test Campaign ${Date.now()}`,
    subject: 'Test Email Subject',
    type: 'promotional',
    ...overrides
  };
}

export function createTestTemplate(overrides: Partial<any> = {}) {
  return {
    name: `Test Template ${Date.now()}`,
    subject: 'Test Subject',
    htmlContent: '<h1>Test</h1><p>{{content}}</p>',
    textContent: 'Test {{content}}',
    variables: ['content'],
    ...overrides
  };
}

export async function cleanupMarketingTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { campaignIds?: string[]; templateIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.campaignIds || []) {
    try {
      await client.delete(`/business/marketing/campaigns/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.templateIds || []) {
    try {
      await client.delete(`/business/marketing/templates/${id}`, { headers });
    } catch (error) {}
  }
}
