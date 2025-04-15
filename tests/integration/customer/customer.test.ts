import { AxiosInstance } from 'axios';
import { 
  setupCustomerTests, 
  cleanupCustomerTests, 
  testCustomer,
  testCustomerAddress,
  testCustomerGroup,
  testCustomerWishlist
} from './testUtils';

describe('Customer Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCustomerId: string;
  let testCustomerAddressId: string;
  let testCustomerGroupId: string;
  let testWishlistId: string | null;

  beforeAll(async () => {
    // Use a longer timeout for setup as it creates multiple test entities
    jest.setTimeout(30000);
    const setup = await setupCustomerTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCustomerId = setup.testCustomerId;
    testCustomerAddressId = setup.testCustomerAddressId;
    testCustomerGroupId = setup.testCustomerGroupId;
    testWishlistId = setup.testWishlistId;
  });

  afterAll(async () => {
    await cleanupCustomerTests(client, adminToken, {
      testCustomerId,
      testCustomerAddressId,
      testCustomerGroupId,
      testWishlistId
    });
  });

  describe('Customer API', () => {
    it('should get customer by ID with camelCase properties', async () => {
      const response = await client.get(`/api/admin/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testCustomerId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('firstName', testCustomer.firstName);
      expect(response.data.data).toHaveProperty('lastName', testCustomer.lastName);
      expect(response.data.data).toHaveProperty('email', testCustomer.email);
      expect(response.data.data).toHaveProperty('isActive', testCustomer.isActive);
      expect(response.data.data).toHaveProperty('isVerified', testCustomer.isVerified);
      
      // Verify timestamps are present and in camelCase
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('first_name');
      expect(response.data.data).not.toHaveProperty('last_name');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('is_verified');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should update a customer with camelCase properties', async () => {
      const updateData = {
        firstName: 'UpdatedFirstName',
        lastName: 'UpdatedLastName',
        notes: 'Updated notes for testing'
      };
      
      const response = await client.put(`/api/admin/customers/${testCustomerId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('firstName', updateData.firstName);
      expect(response.data.data).toHaveProperty('lastName', updateData.lastName);
      expect(response.data.data).toHaveProperty('notes', updateData.notes);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('email', testCustomer.email);
      
      // Verify response is using camelCase
      expect(response.data.data).not.toHaveProperty('first_name');
      expect(response.data.data).not.toHaveProperty('last_name');
    });

    it('should list all customers with camelCase properties', async () => {
      const response = await client.get('/api/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test customer in the results
      const customer = response.data.data.find((c: any) => c.id === testCustomerId);
      expect(customer).toBeDefined();
      
      if (customer) {
        // Verify properties use camelCase
        expect(customer).toHaveProperty('firstName');
        expect(customer).toHaveProperty('lastName');
        expect(customer).toHaveProperty('isActive');
        expect(customer).toHaveProperty('createdAt');
        expect(customer).not.toHaveProperty('first_name');
        expect(customer).not.toHaveProperty('last_name');
        expect(customer).not.toHaveProperty('is_active');
        expect(customer).not.toHaveProperty('created_at');
      }
    });

    it('should search customers and return camelCase properties', async () => {
      const response = await client.get(`/api/admin/customers/search?term=${encodeURIComponent('UpdatedFirstName')}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our updated customer
      const foundCustomer = response.data.data.find((c: any) => c.id === testCustomerId);
      expect(foundCustomer).toBeDefined();
      
      if (foundCustomer) {
        // Verify camelCase properties
        expect(foundCustomer).toHaveProperty('firstName', 'UpdatedFirstName');
        expect(foundCustomer).not.toHaveProperty('first_name');
      }
    });
  });

  describe('Customer Address API', () => {
    it('should get customer address by ID with camelCase properties', async () => {
      const response = await client.get(`/api/admin/customer-addresses/${testCustomerAddressId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testCustomerAddressId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('addressLine1', testCustomerAddress.addressLine1);
      expect(response.data.data).toHaveProperty('addressLine2', testCustomerAddress.addressLine2);
      expect(response.data.data).toHaveProperty('postalCode', testCustomerAddress.postalCode);
      expect(response.data.data).toHaveProperty('addressType', testCustomerAddress.addressType);
      expect(response.data.data).toHaveProperty('isDefault', testCustomerAddress.isDefault);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('address_line1');
      expect(response.data.data).not.toHaveProperty('address_line2');
      expect(response.data.data).not.toHaveProperty('postal_code');
      expect(response.data.data).not.toHaveProperty('address_type');
      expect(response.data.data).not.toHaveProperty('is_default');
    });

    it('should list customer addresses with camelCase properties', async () => {
      const response = await client.get(`/api/admin/customers/${testCustomerId}/addresses`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test address in the results
      const address = response.data.data.find((a: any) => a.id === testCustomerAddressId);
      expect(address).toBeDefined();
      
      if (address) {
        // Verify properties use camelCase
        expect(address).toHaveProperty('addressLine1');
        expect(address).toHaveProperty('addressLine2');
        expect(address).toHaveProperty('postalCode');
        expect(address).toHaveProperty('isDefault');
        expect(address).not.toHaveProperty('address_line1');
        expect(address).not.toHaveProperty('address_line2');
        expect(address).not.toHaveProperty('postal_code');
        expect(address).not.toHaveProperty('is_default');
      }
    });
  });

  describe('Customer Group API', () => {
    it('should get customer group by ID with camelCase properties', async () => {
      const response = await client.get(`/api/admin/customer-groups/${testCustomerGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testCustomerGroupId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testCustomerGroup.name);
      expect(response.data.data).toHaveProperty('description', testCustomerGroup.description);
      expect(response.data.data).toHaveProperty('discountPercentage', testCustomerGroup.discountPercentage);
      expect(response.data.data).toHaveProperty('isActive', testCustomerGroup.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('discount_percentage');
      expect(response.data.data).not.toHaveProperty('is_active');
    });

    it('should get customers in group with camelCase properties', async () => {
      const response = await client.get(`/api/admin/customer-groups/${testCustomerGroupId}/customers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our customer in this group
      const foundCustomer = response.data.data.find((c: any) => c.id === testCustomerId);
      expect(foundCustomer).toBeDefined();
      
      if (foundCustomer) {
        // Verify camelCase properties
        expect(foundCustomer).toHaveProperty('firstName');
        expect(foundCustomer).toHaveProperty('lastName');
        expect(foundCustomer).not.toHaveProperty('first_name');
        expect(foundCustomer).not.toHaveProperty('last_name');
      }
    });
  });
});
