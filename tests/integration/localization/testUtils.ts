import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export async function setupLocalizationTests() {
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
    throw new Error('Failed to get admin token for Localization tests');
  }

  return { client, adminToken };
}

export function createTestLanguage(overrides: Partial<any> = {}) {
  const code = `t${Date.now().toString().slice(-2)}`;
  return {
    code,
    name: `Test Language ${code}`,
    nativeName: `Test ${code}`,
    isDefault: false,
    isActive: true,
    ...overrides
  };
}

export function createTestLocale(languageCode: string, overrides: Partial<any> = {}) {
  return {
    code: `${languageCode}-XX`,
    languageCode,
    currencyCode: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: { decimal: '.', thousands: ',' },
    isActive: true,
    ...overrides
  };
}

export async function cleanupLocalizationTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { languageCodes?: string[]; localeCodes?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const code of resources.localeCodes || []) {
    try {
      await client.delete(`/business/localization/locales/${code}`, { headers });
    } catch (error) {}
  }

  for (const code of resources.languageCodes || []) {
    try {
      await client.delete(`/business/localization/languages/${code}`, { headers });
    } catch (error) {}
  }
}
