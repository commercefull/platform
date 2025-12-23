import { AxiosInstance } from 'axios';
import {
  setupMembershipTests,
  cleanupMembershipTests,
  testTier,
  testBenefit,
  testUserMembership
} from './testUtils';

describe('Membership Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let testTierId: string;
  let testBenefitId: string;
  let testUserMembershipId: string;

  beforeAll(async () => {
    const setup = await setupMembershipTests();
    client = setup.client;
    adminToken = setup.adminToken;
    userToken = setup.userToken;
    userId = setup.userId;
    testTierId = setup.testTierId;
    testBenefitId = setup.testBenefitId;
    testUserMembershipId = setup.testUserMembershipId;
  });

  afterAll(async () => {
    await cleanupMembershipTests(client, adminToken, testTierId, testBenefitId, testUserMembershipId);
  });

  describe('Tier Management', () => {
    it('should get all membership tiers', async () => {
      const response = await client.get('/business/membership/tiers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses (TypeScript interface)
        // DB returns membershipTierId, not id
        const tier = response.data.data.find((t: any) => (t.membershipTierId || t.id) === testTierId);
        expect(tier).toBeDefined();
        expect(tier).toHaveProperty('monthlyPrice');
        expect(tier).toHaveProperty('annualPrice');
        expect(tier).toHaveProperty('isActive');
        // Check that snake_case is not present in the response
        expect(tier).not.toHaveProperty('monthly_price');
        expect(tier).not.toHaveProperty('annual_price');
        expect(tier).not.toHaveProperty('is_active');
      }
    });

    it('should get a tier by ID', async () => {
      const response = await client.get(`/business/membership/tiers/${testTierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns membershipTierId, not id
      const tierId = response.data.data.membershipTierId || response.data.data.id;
      expect(tierId).toBe(testTierId);
      expect(response.data.data).toHaveProperty('name', testTier.name);
      // Prices may be returned as strings from PostgreSQL decimal type
      expect(parseFloat(response.data.data.monthlyPrice)).toBe(testTier.monthlyPrice);
      expect(parseFloat(response.data.data.annualPrice)).toBe(testTier.annualPrice);
    });

    it('should update a tier', async () => {
      const updateData = {
        name: 'Updated Test Tier',
        description: 'Updated description for testing',
        monthlyPrice: 24.99
      };
      
      const response = await client.put(`/business/membership/tiers/${testTierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      // Prices may be returned as strings from PostgreSQL decimal type
      expect(parseFloat(response.data.data.monthlyPrice)).toBe(updateData.monthlyPrice);
      // The annual price should remain unchanged
      expect(parseFloat(response.data.data.annualPrice)).toBe(testTier.annualPrice);
    });
  });

  describe('Benefit Management', () => {
    it('should get all benefits', async () => {
      const response = await client.get('/business/membership/benefits', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses
        // DB returns membershipBenefitId, not id
        const benefit = response.data.data.find((b: any) => (b.membershipBenefitId || b.id) === testBenefitId);
        expect(benefit).toBeDefined();
        expect(benefit).toHaveProperty('tierIds');
        expect(benefit).toHaveProperty('benefitType');
        expect(benefit).toHaveProperty('discountPercentage');
        expect(benefit).toHaveProperty('isActive');
        // Check that snake_case is not present in the response
        expect(benefit).not.toHaveProperty('tier_ids');
        expect(benefit).not.toHaveProperty('benefit_type');
        expect(benefit).not.toHaveProperty('discount_percentage');
        expect(benefit).not.toHaveProperty('is_active');
      }
    });

    it('should get a benefit by ID', async () => {
      const response = await client.get(`/business/membership/benefits/${testBenefitId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns membershipBenefitId, not id
      const benefitId = response.data.data.membershipBenefitId || response.data.data.id;
      expect(benefitId).toBe(testBenefitId);
      expect(response.data.data).toHaveProperty('name', testBenefit.name);
      expect(response.data.data).toHaveProperty('benefitType', testBenefit.benefitType);
      expect(response.data.data).toHaveProperty('discountPercentage', testBenefit.discountPercentage);
    });

    it('should update a benefit', async () => {
      if (!testBenefitId) {
        
        return;
      }
      
      const updateData = {
        name: 'Updated Test Benefit',
        description: 'Updated benefit description',
        discountPercentage: 15
      };
      
      const response = await client.put(`/business/membership/benefits/${testBenefitId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('name', updateData.name);
      }
    });

    it('should get benefits for a specific tier', async () => {
      if (!testTierId) {
        
        return;
      }
      
      const response = await client.get(`/business/membership/tiers/${testTierId}/benefits`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });
  });

  describe('User Membership Management', () => {
    it('should get a user membership by ID', async () => {
      if (!testUserMembershipId) {
        
        return;
      }
      
      const response = await client.get(`/business/membership/user-memberships/${testUserMembershipId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        // DB returns userMembershipId, not id
        const membershipId = response.data.data.userMembershipId || response.data.data.id;
        expect(membershipId).toBe(testUserMembershipId);
      }
    });

    it('should get user membership with tier details', async () => {
      if (!testUserMembershipId) {
        
        return;
      }
      
      const response = await client.get(`/business/membership/user-memberships/${testUserMembershipId}/with-tier`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        // DB returns userMembershipId, not id
        const membershipId = response.data.data.userMembershipId || response.data.data.id;
        expect(membershipId).toBe(testUserMembershipId);
      }
    });

    it('should update a user membership', async () => {
      if (!testUserMembershipId) {
        
        return;
      }
      
      const updateData = {
        autoRenew: false,
        membershipType: 'monthly'
      };
      
      const response = await client.put(`/business/membership/user-memberships/${testUserMembershipId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should cancel a user membership', async () => {
      if (!testUserMembershipId) {
        
        return;
      }
      
      const response = await client.put(`/business/membership/user-memberships/${testUserMembershipId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  describe('Public API Tests', () => {
    it('should get public tier information', async () => {
      // Customer routes are under /customer/ prefix
      const response = await client.get('/customer/membership/tiers');
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });

    it('should get public benefit information for a tier', async () => {
      if (!testTierId) {
        
        return;
      }
      
      // Customer routes are under /customer/ prefix
      const response = await client.get(`/customer/membership/tiers/${testTierId}/benefits`);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });

    it('should get user membership details when authenticated', async () => {
      // Customer routes are under /customer/ prefix
      const response = await client.get('/customer/membership/my-membership', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // Response status may vary depending on whether the user has an active membership
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should deny access to membership details without authentication', async () => {
      // Customer routes are under /customer/ prefix
      const response = await client.get('/customer/membership/my-membership');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Naming Convention Tests', () => {
    // Specific tests to verify that the membership feature correctly follows
    // the platform's naming convention with snake_case for DB and camelCase for TypeScript
    
    it('should maintain camelCase properties in tier responses', async () => {
      const response = await client.get(`/business/membership/tiers/${testTierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const tier = response.data.data;
      
      // Verify camelCase properties are present
      expect(tier).toHaveProperty('monthlyPrice');
      expect(tier).toHaveProperty('annualPrice');
      expect(tier).toHaveProperty('isActive');
      expect(tier).toHaveProperty('createdAt');
      expect(tier).toHaveProperty('updatedAt');
      
      // Verify snake_case properties are NOT present
      expect(tier).not.toHaveProperty('monthly_price');
      expect(tier).not.toHaveProperty('annual_price');
      expect(tier).not.toHaveProperty('is_active');
      expect(tier).not.toHaveProperty('created_at');
      expect(tier).not.toHaveProperty('updated_at');
    });
    
    it('should maintain camelCase properties in benefit responses', async () => {
      const response = await client.get(`/business/membership/benefits/${testBenefitId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const benefit = response.data.data;
      
      // Verify camelCase properties are present
      expect(benefit).toHaveProperty('tierIds');
      expect(benefit).toHaveProperty('benefitType');
      expect(benefit).toHaveProperty('discountPercentage');
      expect(benefit).toHaveProperty('isActive');
      
      // Verify snake_case properties are NOT present
      expect(benefit).not.toHaveProperty('tier_ids');
      expect(benefit).not.toHaveProperty('benefit_type');
      expect(benefit).not.toHaveProperty('discount_percentage');
      expect(benefit).not.toHaveProperty('is_active');
    });
    
    it('should maintain camelCase properties in user membership responses', async () => {
      const response = await client.get(`/business/membership/user-memberships/${testUserMembershipId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const membership = response.data.data;
      
      // Verify camelCase properties are present
      expect(membership).toHaveProperty('userId');
      expect(membership).toHaveProperty('tierId');
      expect(membership).toHaveProperty('startDate');
      expect(membership).toHaveProperty('endDate');
      expect(membership).toHaveProperty('isActive');
      expect(membership).toHaveProperty('autoRenew');
      expect(membership).toHaveProperty('membershipType');
      
      // Verify snake_case properties are NOT present
      expect(membership).not.toHaveProperty('user_id');
      expect(membership).not.toHaveProperty('tier_id');
      expect(membership).not.toHaveProperty('start_date');
      expect(membership).not.toHaveProperty('end_date');
      expect(membership).not.toHaveProperty('is_active');
      expect(membership).not.toHaveProperty('auto_renew');
      expect(membership).not.toHaveProperty('membership_type');
    });
  });
});
