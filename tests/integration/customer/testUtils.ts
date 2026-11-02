
// Seeded test IDs from seeds/20240805002001_seedIntegrationTestData.js
export const SEEDED_CUSTOMER_ID = '00000000-0000-0000-0000-000000001001';

export const SEEDED_CUSTOMER_ADDRESS_ID = '00000000-0000-0000-0000-000000006001';
export const SEEDED_CUSTOMER_GROUP_ID = '00000000-0000-0000-0000-000000006002';

// Test data for creating new entities within individual tests
export const testCustomer = {
  email: 'testcustomer@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  password: 'TestPassword123!',
  phone: '555-123-4567',
  dateOfBirth: new Date('1990-01-01').toISOString().split('T')[0],
  isActive: true,
  isVerified: false,
  note: 'Test customer for integration tests',
};







