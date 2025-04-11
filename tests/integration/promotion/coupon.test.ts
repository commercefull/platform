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
    const response = await client.post('/api/admin/coupons', testCoupon, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('id');
    
    // Save the coupon ID for later tests
    couponId = response.data.data.id;
    
    // Validate the coupon data
    expect(response.data.data.code).toBe(testCoupon.code);
    expect(response.data.data.value).toBe(testCoupon.value);
  });

  it('should get a coupon by ID', async () => {
    const response = await client.get(`/api/admin/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toBe(couponId);
  });

  it('should get a coupon by code', async () => {
    const response = await client.get(`/api/admin/coupons/code/${testCoupon.code}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toBe(couponId);
  });

  it('should validate a coupon', async () => {
    const response = await client.post('/api/admin/coupons/validate', {
      code: testCoupon.code,
      orderTotal: 50
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('valid');
    expect(response.data.data.valid).toBe(true);
    expect(response.data.data.coupon.code).toBe(testCoupon.code);
  });

  it('should calculate a coupon discount', async () => {
    const cartItems = [
      { productId: testProductId, quantity: 2, price: 49.99 }
    ];
    
    const response = await client.post('/api/admin/coupons/validate', {
      code: testCoupon.code,
      orderTotal: 99.98,
      items: cartItems
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the discount calculation
    // 15% of 99.98 should be about 15
    const couponDiscount = response.data.data.coupon.value / 100 * 99.98;
    expect(couponDiscount).toBeCloseTo(15, 0);
  });

  it('should update a coupon', async () => {
    const updateData = {
      name: 'Updated Test Coupon',
      value: 20
    };
    
    const response = await client.put(`/api/admin/coupons/${couponId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(response.data.data.value).toBe(updateData.value);
  });
  
  it('should delete a coupon', async () => {
    const response = await client.delete(`/api/admin/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the coupon is deleted
    const getResponse = await client.get(`/api/admin/coupons/${couponId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
