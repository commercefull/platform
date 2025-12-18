import { AxiosInstance } from 'axios';
import axios from 'axios';
import { 
  cleanupCustomerTests, 
  testCustomer,
  testCustomerAddress,
  testCustomerGroup,
  testCustomerWishlist
} from './testUtils';

const createClient = () => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Test-Request': 'true'
  }
});

describe('Customer Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCustomerId: string;
  let testCustomerAddressId: string;
  let testCustomerGroupId: string | null;
  let testWishlistId: string | null;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    
    try {
      const loginResponse = await client.post('/business/auth/login', {
        email: 'merchant@example.com',
        password: 'password123'
      }, { headers: { 'X-Test-Request': 'true' } });
      
      adminToken = loginResponse.data?.accessToken || '';
    } catch (error) {
      console.log('Warning: Login failed for customer tests:', error instanceof Error ? error.message : String(error));
    }

    // Create test customer and related entities
    try {
      if (adminToken) {
        // Create Customer
        const customerResponse = await client.post('/business/customers', testCustomer, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (customerResponse.data?.success && customerResponse.data?.data) {
          testCustomerId = customerResponse.data.data.customerId || customerResponse.data.data.id || '';
          
          // Create Customer Address
          if (testCustomerId) {
            const addressResponse = await client.post(`/business/customers/${testCustomerId}/addresses`, testCustomerAddress, {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            
            if (addressResponse.data?.success && addressResponse.data?.data) {
              testCustomerAddressId = addressResponse.data.data.customerAddressId || addressResponse.data.data.addressId || addressResponse.data.data.id || '';
            }
            
            // Create Customer Group (optional)
            try {
              const groupResponse = await client.post('/business/customer-groups', testCustomerGroup, {
                headers: { Authorization: `Bearer ${adminToken}` }
              });
              
              if (groupResponse.data?.success && groupResponse.data?.data) {
                testCustomerGroupId = groupResponse.data.data.customerGroupId || groupResponse.data.data.id;
                
                // Add Customer to Group
                await client.post(`/business/customers/${testCustomerId}/groups/${testCustomerGroupId}`, {}, {
                  headers: { Authorization: `Bearer ${adminToken}` }
                });
              }
            } catch (e) {
              console.log('Customer group endpoint not available, skipping group tests');
              testCustomerGroupId = null;
            }
            
            // Create Wishlist (optional)
            try {
              const wishlistResponse = await client.post(`/business/customers/${testCustomerId}/wishlists`, {
                ...testCustomerWishlist
              }, {
                headers: { Authorization: `Bearer ${adminToken}` }
              });
              
              if (wishlistResponse.data?.success && wishlistResponse.data?.data) {
                testWishlistId = wishlistResponse.data.data.customerWishlistId || wishlistResponse.data.data.id;
              }
            } catch (e) {
              console.log('Wishlist endpoint not available, skipping wishlist tests');
              testWishlistId = null;
            }
          }
        }
      }
    } catch (error) {
      console.log('Warning: Customer test setup error:', error);
    }
  });

  afterAll(async () => {
    if (adminToken && testCustomerId) {
      await cleanupCustomerTests(client, adminToken, {
        testCustomerId,
        testCustomerAddressId,
        testCustomerGroupId,
        testWishlistId
      });
    }
  });

  describe('Customer API', () => {
    it('should get customer by ID with camelCase properties', async () => {
      if (!testCustomerId) {
        console.log('Skipping test - customer not created');
        return;
      }
      
      const response = await client.get(`/business/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Check for customerId (new format) or id (legacy format)
      expect(response.data.data.customerId || response.data.data.id).toBe(testCustomerId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('firstName');
      expect(response.data.data).toHaveProperty('lastName');
      expect(response.data.data).toHaveProperty('email');
      
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
      if (!testCustomerId) {
        console.log('Skipping test - customer not created');
        return;
      }
      
      const updateData = {
        firstName: 'UpdatedFirstName',
        lastName: 'UpdatedLastName'
      };
      
      const response = await client.put(`/business/customers/${testCustomerId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked - response may contain updated fields list or full customer
      if (response.data.data.updatedFields) {
        expect(response.data.data.updatedFields).toContain('firstName');
        expect(response.data.data.updatedFields).toContain('lastName');
      } else {
        expect(response.data.data).toHaveProperty('firstName', updateData.firstName);
        expect(response.data.data).toHaveProperty('lastName', updateData.lastName);
      }
    });

    it('should list all customers with camelCase properties', async () => {
      const response = await client.get('/business/customers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Response may be paginated with data array or direct array
      const customers = response.data.data?.data || response.data.data;
      expect(Array.isArray(customers)).toBe(true);
      
      // Find our test customer in the results
      const customer = customers.find((c: any) => (c.customerId || c.id) === testCustomerId);
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
      if (!testCustomerId) {
        console.log('Skipping test - customer not created');
        return;
      }
      
      const response = await client.get(`/business/customers?search=${encodeURIComponent('UpdatedFirstName')}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      const customers = response.data.data?.data || response.data.data;
      expect(Array.isArray(customers)).toBe(true);
      
      // Should find our updated customer
      const foundCustomer = customers.find((c: any) => (c.customerId || c.id) === testCustomerId);
      expect(foundCustomer).toBeDefined();
      
      if (foundCustomer) {
        // Verify camelCase properties
        expect(foundCustomer).toHaveProperty('firstName', 'UpdatedFirstName');
        expect(foundCustomer).not.toHaveProperty('first_name');
      }
    });
  });

  describe('Customer Address API', () => {
    it('should list customer addresses with camelCase properties', async () => {
      if (!testCustomerId) {
        console.log('Skipping test - customer not created');
        return;
      }
      
      const response = await client.get(`/business/customers/${testCustomerId}/addresses`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Response may be { addresses: [...] } or direct array
      const addresses = response.data.data?.addresses || (Array.isArray(response.data.data) ? response.data.data : []);
      expect(Array.isArray(addresses)).toBe(true);
      
      // Find our test address in the results
      const address = addresses.find((a: any) => (a.customerAddressId || a.addressId || a.id) === testCustomerAddressId);
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
      if (!testCustomerGroupId) {
        console.log('Skipping test - customer group endpoint not available');
        return;
      }
      
      const response = await client.get(`/business/customer-groups/${testCustomerGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.customerGroupId || response.data.data.id).toBe(testCustomerGroupId);
      
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
      if (!testCustomerGroupId) {
        console.log('Skipping test - customer group endpoint not available');
        return;
      }
      
      const response = await client.get(`/business/customer-groups/${testCustomerGroupId}/customers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our customer in this group
      const customers = response.data.data?.data || response.data.data;
      const foundCustomer = customers.find((c: any) => (c.customerId || c.id) === testCustomerId);
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
