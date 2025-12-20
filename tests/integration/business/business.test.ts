/**
 * Business API Integration Tests
 * Tests business operations through HTTP API endpoints
 */

import axios from 'axios';
import { Express } from 'express';
import { configureRoutes } from '../../../boot/routes';
import express from 'express';

describe('Business API Integration', () => {
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

  describe('POST /business/businesses', () => {
    it('should create a single-store business successfully', async () => {
      const businessData = {
        name: 'Test Business',
        slug: 'test-business',
        domain: 'testbusiness.com',
        businessType: 'single_store',
        defaultCurrency: 'USD',
        defaultLanguage: 'en',
        timezone: 'UTC'
      };

      const response = await axios.post('/business/businesses', businessData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      const business = response.data.data;
      expect(business.businessId).toBeDefined();
      expect(business.name).toBe('Test Business');
      expect(business.slug).toBe('test-business');
      expect(business.businessType).toBe('single_store');
      expect(business.domain).toBe('testbusiness.com');
      expect(business.isActive).toBe(true);
    });

    it('should create a multi-store business', async () => {
      const businessData = {
        name: 'Multi-Store Business',
        slug: 'multi-store-business',
        domain: 'multistore.com',
        businessType: 'multi_store',
        allowMultipleStores: true,
        defaultCurrency: 'EUR',
        defaultLanguage: 'de',
        timezone: 'Europe/Berlin'
      };

      const response = await axios.post('/business/businesses', businessData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.businessType).toBe('multi_store');
      expect(response.data.data.domain).toBe('multistore.com');
    });

    it('should create a marketplace business', async () => {
      const businessData = {
        name: 'Marketplace Business',
        slug: 'marketplace-business',
        domain: 'marketplacebiz.com',
        businessType: 'marketplace',
        defaultCurrency: 'GBP'
      };

      const response = await axios.post('/business/businesses', businessData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.businessType).toBe('marketplace');
    });

    it('should enforce unique slug constraint', async () => {
      // Create first business
      const businessData1 = {
        name: 'First Business',
        slug: 'unique-slug',
        domain: 'first.com'
      };

      await axios.post('/business/businesses', businessData1);

      // Try to create second business with same slug
      const businessData2 = {
        name: 'Second Business',
        slug: 'unique-slug', // Same slug
        domain: 'second.com'
      };

      const response = await axios.post('/business/businesses', businessData2);

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('slug');
    });

    it('should enforce unique domain constraint', async () => {
      // Create first business
      const businessData1 = {
        name: 'Domain Business 1',
        slug: 'domain-business-1',
        domain: 'unique-domain.com'
      };

      await axios.post('/business/businesses', businessData1);

      // Try to create second business with same domain
      const businessData2 = {
        name: 'Domain Business 2',
        slug: 'domain-business-2',
        domain: 'unique-domain.com' // Same domain
      };

      const response = await axios.post('/business/businesses', businessData2);

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('domain');
    });

    it('should validate business type against system mode', async () => {
      // System is in single_store mode, try to create marketplace business
      const businessData = {
        name: 'Validation Test Business',
        slug: 'validation-test',
        domain: 'validation.com',
        businessType: 'marketplace' // Not allowed in single_store mode
      };

      const response = await axios.post('/business/businesses', businessData);

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('business type');
    });
  });

  describe('GET /business/businesses/:businessId', () => {
    let testBusinessId: string;

    beforeAll(async () => {
      // Create a test business
      const businessData = {
        name: 'Get Test Business',
        slug: 'get-test-business',
        domain: 'gettest.com',
        businessType: 'single_store'
      };

      const response = await axios.post('/business/businesses', businessData);

      testBusinessId = response.data.data.businessId;
    });

    it('should retrieve business by ID', async () => {
      const response = await axios.get(`/business/businesses/${testBusinessId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.businessId).toBe(testBusinessId);
      expect(response.data.data.name).toBe('Get Test Business');
      expect(response.data.data.slug).toBe('get-test-business');
    });

    it('should return 404 for non-existent business', async () => {
      const response = await axios.get('/business/businesses/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toBe('Business not found');
    });
  });

  describe('GET /business/businesses/slug/:slug', () => {
    it('should retrieve business by slug', async () => {
      // Create business first
      const businessData = {
        name: 'Slug Test Business',
        slug: 'slug-test-business',
        domain: 'slugtest.com'
      };

      await axios.post('/business/businesses', businessData);

      // Retrieve by slug
      const response = await axios.get('/business/businesses/slug/slug-test-business');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.slug).toBe('slug-test-business');
    });
  });

  describe('GET /business/businesses', () => {
    beforeAll(async () => {
      // Create multiple test businesses
      const businesses = [
        {
          name: 'List Business 1',
          slug: 'list-business-1',
          domain: 'list1.com'
        },
        {
          name: 'List Business 2',
          slug: 'list-business-2',
          domain: 'list2.com'
        }
      ];

      for (const business of businesses) {
        await axios.post('/business/businesses', business);
      }
    });

    it('should list all businesses', async () => {
      const response = await axios.get('/business/businesses');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.count).toBeGreaterThanOrEqual(2);

      // Verify structure
      response.data.data.forEach((business: any) => {
        expect(business.businessId).toBeDefined();
        expect(business.name).toBeDefined();
        expect(business.slug).toBeDefined();
        expect(business.businessType).toBeDefined();
      });
    });
  });
});
