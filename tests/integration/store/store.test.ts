/**
 * Store API Integration Tests
 * Tests store operations through HTTP API endpoints
 */

import axios from 'axios';
import { Express } from 'express';
import { configureRoutes } from '../../../boot/routes';
import express from 'express';

describe('Store API Integration', () => {
    let app: Express;
    let server: any;
    let baseURL: string;

    beforeAll(async () => {
        // Setup test app with routes
        app = express();
        app.use(express.json());
        configureRoutes(app);

        // Start server on random port
        server = app.listen(0);
        const port = server.address().port;
        baseURL = `http://localhost:${port}`;

        // Configure axios defaults
        axios.defaults.baseURL = baseURL;
        axios.defaults.validateStatus = () => true; // Don't throw on any status code
    });

    describe('POST /business/stores', () => {
        let testBusinessId: string;

        beforeAll(async () => {
            // Create a test business for store ownership
            const businessData = {
                name: 'Store Test Business',
                slug: 'store-test-business',
                domain: 'storetestbusiness.com',
                businessType: 'multi_store',
                allowMultipleStores: true
            };

            const businessResponse = await axios.post('/business/businesses', businessData);

            testBusinessId = businessResponse.data.data.businessId;
        });

        it('should create a business-owned store successfully', async () => {
            const storeData = {
                name: 'Test Store',
                slug: 'test-store',
                storeUrl: 'https://teststore.com',
                businessId: testBusinessId,
                storeType: 'business_store',
                defaultCurrency: 'USD',
                storeEmail: 'store@teststore.com',
                storePhone: '+1-555-0123',
                address: {
                    street1: '123 Main St',
                    city: 'Test City',
                    state: 'TS',
                    postalCode: '12345',
                    country: 'US'
                }
            };

            const response = await axios.post('/business/stores', storeData);

            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data).toBeDefined();

            const store = response.data.data;
            expect(store.storeId).toBeDefined();
            expect(store.name).toBe('Test Store');
            expect(store.slug).toBe('test-store');
            expect(store.businessId).toBe(testBusinessId);
            expect(store.storeType).toBe('business_store');
            expect(store.isActive).toBe(true);
            expect(store.isVerified).toBe(false);
        });

        it('should create a merchant-owned store in marketplace mode', async () => {
            // First, update system configuration to marketplace mode
            const configData = {
                platformName: 'Marketplace Test Platform',
                platformDomain: 'marketplace.com',
                supportEmail: 'support@marketplace.com',
                systemMode: 'marketplace'
            };

            await axios.put('/business/configuration/test-system-config', configData);

            const storeData = {
                name: 'Merchant Store',
                slug: 'merchant-store',
                storeUrl: 'https://merchantstore.com',
                merchantId: 'test-merchant-123',
                storeType: 'merchant_store',
                defaultCurrency: 'EUR',
                storeEmail: 'merchant@store.com'
            };

            const response = await axios.post('/business/stores', storeData);

            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.storeType).toBe('merchant_store');
            expect(response.data.data.merchantId).toBe('test-merchant-123');
            expect(response.data.data.businessId).toBeUndefined();

            // Reset system configuration
            await axios.put('/business/configuration/test-system-config', { systemMode: 'multi_store' });
        });

        it('should handle store settings and policies', async () => {
            const storeData = {
                name: 'Settings Test Store',
                slug: 'settings-store',
                storeUrl: 'https://settingsstore.com',
                businessId: testBusinessId,
                storeType: 'business_store',
                settings: {
                    allowGuestCheckout: false,
                    requireAccountForPurchase: true,
                    enableWishlist: true,
                    enableProductReviews: true,
                    inventoryDisplayMode: 'show_low_stock',
                    priceDisplayMode: 'inclusive_tax'
                },
                storePolicies: {
                    returnPolicy: '30-day return policy',
                    shippingPolicy: 'Free shipping over $50',
                    privacyPolicy: 'We respect your privacy'
                }
            };

            const response = await axios.post('/business/stores', storeData);

            expect(response.status).toBe(201);
            expect(response.data.success).toBe(true);
            expect(response.data.data.settings.allowGuestCheckout).toBe(false);
            expect(response.data.data.settings.requireAccountForPurchase).toBe(true);
            expect(response.data.data.storePolicies.returnPolicy).toBe('30-day return policy');
        });

        it('should enforce unique slug constraint', async () => {
            // Create first store
            const storeData1 = {
                name: 'First Store',
                slug: 'unique-store-slug',
                storeUrl: 'https://firststore.com',
                businessId: testBusinessId,
                storeType: 'business_store'
            };

            await axios.post('/business/stores', storeData1);

            // Try to create second store with same slug
            const storeData2 = {
                name: 'Second Store',
                slug: 'unique-store-slug', // Same slug
                storeUrl: 'https://secondstore.com',
                businessId: testBusinessId,
                storeType: 'business_store'
            };

            const response = await axios.post('/business/stores', storeData2);

            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);
            expect(response.data.message).toContain('slug');
        });

        it('should enforce unique store URL constraint', async () => {
            // Create first store
            const storeData1 = {
                name: 'URL Store 1',
                slug: 'url-store-1',
                storeUrl: 'https://uniquestore.com',
                businessId: testBusinessId,
                storeType: 'business_store'
            };

            await axios.post('/business/stores', storeData1);

            // Try to create second store with same URL
            const storeData2 = {
                name: 'URL Store 2',
                slug: 'url-store-2',
                storeUrl: 'https://uniquestore.com', // Same URL
                businessId: testBusinessId,
                storeType: 'business_store'
            };

            const response = await axios.post('/business/stores', storeData2);

            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);
            expect(response.data.message).toContain('URL');
        });

        it('should validate ownership constraints', async () => {
            // Try to create merchant store without merchant ID
            const invalidStoreData = {
                name: 'Invalid Store',
                slug: 'invalid-store',
                storeUrl: 'https://invalid.com',
                storeType: 'merchant_store'
                // Missing merchantId
            };

            const response = await axios.post('/business/stores', invalidStoreData);

            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);
            expect(response.data.message).toContain('Merchant');
        });

        it('should validate store type against system mode', async () => {
            // System is in multi_store mode, but try to create marketplace store
            const invalidStoreData = {
                name: 'Invalid Type Store',
                slug: 'invalid-type-store',
                storeUrl: 'https://invalidtype.com',
                businessId: testBusinessId,
                storeType: 'marketplace_store' // Invalid type
            };

            const response = await axios.post('/business/stores', invalidStoreData);

            expect(response.status).toBe(400);
            expect(response.data.success).toBe(false);
            expect(response.data.message).toContain('store type');
        });
    });

    describe('GET /business/stores/:storeId', () => {
        let testStoreId: string;

        beforeAll(async () => {
            // Create a test business first
            const businessData = {
                name: 'Store Get Test Business',
                slug: 'store-get-test-business',
                domain: 'storegettestbusiness.com',
                businessType: 'single_store',
                defaultCurrency: 'USD',
                defaultLanguage: 'en',
                timezone: 'UTC'
            };

            const businessResponse = await axios.post('/business/businesses', businessData);

            testStoreId = businessResponse.data.data.businessId;
        });

        it('should get store by ID', async () => {
            const response = await axios.get(`/business/stores/${testStoreId}`);

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.data).toBeDefined();

            const store = response.data.data;
            expect(store.storeId).toBe(testStoreId);
            expect(store.name).toBe('Store Get Test Business');
            expect(store.slug).toBe('store-get-test-business');
            expect(store.businessId).toBe(testStoreId);
            expect(store.storeType).toBe('business_store');
            expect(store.isActive).toBe(true);
            expect(store.isVerified).toBe(false);
        });
    });
});