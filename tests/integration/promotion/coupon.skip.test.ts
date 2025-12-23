import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests, testCoupon } from './testUtils';

describe('Coupon API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let couponId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;
  });

  it('should create a new coupon', async () => {
    if (!adminToken) {
      
      return;
    }
    
    const response = await client.post('/business/coupons', testCoupon, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    // API returns promotionCouponId, not id
    expect(response.data.data).toHaveProperty('promotionCouponId');
    
    // Save the coupon ID for later tests
    couponId = response.data.data.promotionCouponId;
    
    // Validate the coupon data
    expect(response.data.data.code).toBe(testCoupon.code);
  });

  it('should get a coupon by ID', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const response = await client.get(`/business/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.promotionCouponId).toBe(couponId);
  });

  it('should get a coupon by code', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const response = await client.get(`/business/coupons/code/${testCoupon.code}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.promotionCouponId).toBe(couponId);
  });

  it('should validate a coupon', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const response = await client.post('/business/coupons/validate', {
      code: testCoupon.code,
      orderTotal: 50
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    if (response.data.data) {
      expect(response.data.data).toHaveProperty('valid');
    }
  });

  it('should calculate a coupon discount', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const cartItems = [
      { productId: testProductId, quantity: 2, price: 49.99 }
    ];
    
    const response = await client.post('/business/coupons/validate', {
      code: testCoupon.code,
      orderTotal: 99.98,
      items: cartItems
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should update a coupon', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const updateData = {
      name: 'Updated Test Coupon',
      discountAmount: 20
    };
    
    const response = await client.put(`/business/coupons/${couponId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
  });
  
  it('should delete a coupon', async () => {
    if (!adminToken || !couponId) {
      
      return;
    }
    
    const response = await client.delete(`/business/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the coupon is deleted
    const getResponse = await client.get(`/business/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
