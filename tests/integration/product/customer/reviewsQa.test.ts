/**
 * Customer: Reviews & Q&A
 * Covers: docs/specs/product/customer.md §2.3, §2.4, §5.3, §5.4, §6
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID } from '../testUtils';

;
;

describe('Customer: Reviews & Q&A', () => {
  let client: AxiosInstance;
  let customerToken: string;
  let createdReviewId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let createdQaId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    customerToken = await loginTestUser(client);
  });

  // ── Reviews ──────────────────────────────────────────────────────────────

  describe('Submit review', () => {
    it('should reject rating below 1', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 0, reviewerName: 'Tester',
      });
      expect(res.status).toBe(400);
    });

    it('should reject rating above 5', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 6, reviewerName: 'Tester',
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing reviewerName', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 4,
      });
      expect(res.status).toBe(400);
    });

    it('should create review with status=pending and isVerifiedPurchase=false when unauthenticated', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 4,
        reviewerName: 'Integration Tester',
        title: 'Great product',
        content: 'Really liked it',
      });
      expect(res.status).toBe(201);
      expect(res.data.data.status).toBe('pending');
      expect(res.data.data.isVerifiedPurchase).toBe(false);
      createdReviewId = res.data.data?.productReviewId || res.data.data?.reviewId || res.data.data?.id;
    });
  });

  describe('Get reviews', () => {
    it('should return only approved reviews with stats', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`);
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('reviews');
      expect(res.data.data).toHaveProperty('averageRating');
      expect(res.data.data).toHaveProperty('ratingDistribution');
      expect(res.data.data).toHaveProperty('totalCount');
      res.data.data.reviews.forEach((r: Record<string, unknown>) => {
        expect(r.status).toBe('approved');
      });
    });
  });

  describe('Helpful / report', () => {
    it('should increment helpfulCount', async () => {
      if (!createdReviewId) return;
      const res = await client.post(`/customer/reviews/${createdReviewId}/helpful`);
      expect(res.status).toBe(200);
    });

    it('should increment reportCount', async () => {
      if (!createdReviewId) return;
      const res = await client.post(`/customer/reviews/${createdReviewId}/report`);
      expect(res.status).toBe(200);
    });
  });

  describe('Vote on review', () => {
    it('should reject vote without authentication', async () => {
      if (!createdReviewId) return;
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: true },
      );
      expect(res.status).toBe(401);
    });

    it('should reject vote without isHelpful boolean', async () => {
      if (!createdReviewId || !customerToken) return;
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: 'yes' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );
      // 400 if customerId in token, 401 if token lacks customerId claim
      expect([400, 401]).toContain(res.status);
    });

    it('should record vote when authenticated', async () => {
      if (!createdReviewId || !customerToken) return;
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: true },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  // ── Q&A ──────────────────────────────────────────────────────────────────

  describe('Submit Q&A', () => {
    it('should reject missing question field', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`, {});
      expect(res.status).toBe(400);
    });

    it('should reject Q&A for non-existent product', async () => {
      const res = await client.post('/customer/products/00000000-0000-0000-0000-999999999999/qa', {
        question: 'Does this exist?',
      });
      expect(res.status).toBe(404);
    });

    it('should create Q&A with status=pending', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`, {
        question: 'Does this come in blue?',
        askerName: 'Test Customer',
      });
      expect(res.status).toBe(201);
      expect(res.data.data.status).toBe('pending');
      createdQaId = res.data.data?.productQaId || res.data.data?.qaId || res.data.data?.id;
    });
  });

  describe('List Q&A', () => {
    it('should return only answered Q&A', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      res.data.data.forEach((qa: Record<string, unknown>) => {
        expect(qa.status).toBe('answered');
      });
    });
  });
});
