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
      const response = await client.get('/api/admin/membership/tiers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses (TypeScript interface)
        const tier = response.data.data.find((t: any) => t.id === testTierId);
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
      const response = await client.get(`/api/admin/membership/tiers/${testTierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTierId);
      expect(response.data.data).toHaveProperty('name', testTier.name);
      expect(response.data.data).toHaveProperty('monthlyPrice', testTier.monthlyPrice);
      expect(response.data.data).toHaveProperty('annualPrice', testTier.annualPrice);
    });

    it('should update a tier', async () => {
      const updateData = {
        name: 'Updated Test Tier',
        description: 'Updated description for testing',
        monthlyPrice: 24.99
      };
      
      const response = await client.put(`/api/admin/membership/tiers/${testTierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      expect(response.data.data).toHaveProperty('monthlyPrice', updateData.monthlyPrice);
      // The annual price should remain unchanged
      expect(response.data.data).toHaveProperty('annualPrice', testTier.annualPrice);
    });
  });

  describe('Benefit Management', () => {
    it('should get all benefits', async () => {
      const response = await client.get('/api/admin/membership/benefits', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses
        const benefit = response.data.data.find((b: any) => b.id === testBenefitId);
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
      const response = await client.get(`/api/admin/membership/benefits/${testBenefitId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testBenefitId);
      expect(response.data.data).toHaveProperty('name', testBenefit.name);
      expect(response.data.data).toHaveProperty('benefitType', testBenefit.benefitType);
      expect(response.data.data).toHaveProperty('discountPercentage', testBenefit.discountPercentage);
    });

    it('should update a benefit', async () => {
      const updateData = {
        name: 'Updated Test Benefit',
        description: 'Updated benefit description',
        discountPercentage: 15
      };
      
      const response = await client.put(`/api/admin/membership/benefits/${testBenefitId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      expect(response.data.data).toHaveProperty('discountPercentage', updateData.discountPercentage);
      // The benefit type should remain unchanged
      expect(response.data.data).toHaveProperty('benefitType', testBenefit.benefitType);
    });

    it('should get benefits for a specific tier', async () => {
      const response = await client.get(`/api/admin/membership/tiers/${testTierId}/benefits`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // The test benefit should be included in the tier's benefits
      const foundBenefit = response.data.data.find((b: any) => b.id === testBenefitId);
      expect(foundBenefit).toBeDefined();
    });
  });

  describe('User Membership Management', () => {
    it('should get a user membership by ID', async () => {
      const response = await client.get(`/api/admin/membership/user-memberships/${testUserMembershipId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testUserMembershipId);
      expect(response.data.data).toHaveProperty('userId', userId);
      expect(response.data.data).toHaveProperty('tierId', testTierId);
      expect(response.data.data).toHaveProperty('isActive', true);
      expect(response.data.data).toHaveProperty('membershipType', testUserMembership.membershipType);
    });

    it('should get user membership with tier details', async () => {
      const response = await client.get(`/api/admin/membership/user-memberships/${testUserMembershipId}/with-tier`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testUserMembershipId);
      
      // Should include tier details
      expect(response.data.data).toHaveProperty('tier');
      expect(response.data.data.tier).toHaveProperty('id', testTierId);
      expect(response.data.data.tier).toHaveProperty('name');
      expect(response.data.data.tier).toHaveProperty('monthlyPrice');
    });

    it('should update a user membership', async () => {
      const updateData = {
        autoRenew: false,
        membershipType: 'monthly'
      };
      
      const response = await client.put(`/api/admin/membership/user-memberships/${testUserMembershipId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('autoRenew', updateData.autoRenew);
      expect(response.data.data).toHaveProperty('membershipType', updateData.membershipType);
    });

    it('should cancel a user membership', async () => {
      const response = await client.put(`/api/admin/membership/user-memberships/${testUserMembershipId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('isActive', false);
      expect(response.data.data).toHaveProperty('autoRenew', false);
    });
  });

  describe('Public API Tests', () => {
    it('should get public tier information', async () => {
      const response = await client.get('/api/membership/tiers');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Check if our test tier is included in the public tiers
      const foundTier = response.data.data.find((t: any) => t.id === testTierId);
      // Our tier may not be included in public results if we cancelled it in previous tests
      if (foundTier) {
        expect(foundTier).toHaveProperty('name');
        expect(foundTier).toHaveProperty('monthlyPrice');
        expect(foundTier).toHaveProperty('annualPrice');
      }
    });

    it('should get public benefit information for a tier', async () => {
      const response = await client.get(`/api/membership/tiers/${testTierId}/benefits`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get user membership details when authenticated', async () => {
      const response = await client.get('/api/membership/my-membership', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // Response status may vary depending on whether the user has an active membership
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should deny access to membership details without authentication', async () => {
      const response = await client.get('/api/membership/my-membership');
      
      expect(response.status).toBe(401);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Naming Convention Tests', () => {
    // Specific tests to verify that the membership feature correctly follows
    // the platform's naming convention with snake_case for DB and camelCase for TypeScript
    
    it('should maintain camelCase properties in tier responses', async () => {
      const response = await client.get(`/api/admin/membership/tiers/${testTierId}`, {
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
      const response = await client.get(`/api/admin/membership/benefits/${testBenefitId}`, {
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
      const response = await client.get(`/api/admin/membership/user-memberships/${testUserMembershipId}`, {
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
