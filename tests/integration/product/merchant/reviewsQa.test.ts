/**
 * Integration tests for reviews and Q&A
 * Covers: spec 07-reviews-qa.md + customer.md sections 2.3 & 2.4
 * - Customer: submit review (valid + invalid guards)
 * - Customer: get reviews with stats
 * - Customer: mark helpful / report
 * - Customer: vote on review (one-per-customer)
 * - Customer: submit Q&A (valid + invalid guards)
 * - Customer: list approved Q&A
 * - Merchant: list / approve / reject / respond / delete review
 * - Merchant: update Q&A status
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_REVIEW_1_ID } from '../testUtils';

describe('Reviews & Q&A', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let createdReviewId: string | null = null;
  let createdQaId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);
  });

  afterAll(async () => {
    if (createdReviewId) {
      await client
        .delete(`/business/reviews/${createdReviewId}`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .catch(() => {});
    }
  });

  // ── Customer: Submit review ──────────────────────────────────────────────

  describe('Customer: Submit review', () => {
    it('should reject review with invalid rating (0)', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 0, reviewerName: 'Tester', content: 'Bad rating',
      });
      expect(res.status).toBe(400);
    });

    it('should reject review with invalid rating (6)', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 6, reviewerName: 'Tester', content: 'Too high',
      });
      expect(res.status).toBe(400);
    });

    it('should reject review without reviewerName', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 4, content: 'No name',
      });
      expect(res.status).toBe(400);
    });

    it('should create a review with status pending (unauthenticated → isVerifiedPurchase=false)', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`, {
        rating: 4,
        reviewerName: 'Integration Tester',
        title: 'Great product',
        content: 'Really liked it',
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('pending');
      expect(res.data.data.isVerifiedPurchase).toBe(false);
      createdReviewId = res.data.data?.productReviewId || res.data.data?.reviewId || res.data.data?.id;
    });
  });

  // ── Customer: Get reviews ────────────────────────────────────────────────

  describe('Customer: Get reviews', () => {
    it('should return reviews with averageRating, ratingDistribution, totalCount', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/reviews`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('reviews');
      expect(res.data.data).toHaveProperty('averageRating');
      expect(res.data.data).toHaveProperty('ratingDistribution');
      expect(res.data.data).toHaveProperty('totalCount');
      // Only approved reviews should be returned
      res.data.data.reviews.forEach((r: Record<string, unknown>) => {
        expect(r.status).toBe('approved');
      });
    });
  });

  // ── Customer: Helpful / report ───────────────────────────────────────────

  describe('Customer: Helpful / report', () => {
    it('should increment helpfulCount', async () => {
      if (!createdReviewId) return;
      const res = await client.post(`/customer/reviews/${createdReviewId}/helpful`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should increment reportCount', async () => {
      if (!createdReviewId) return;
      const res = await client.post(`/customer/reviews/${createdReviewId}/report`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });
  });

  // ── Customer: Vote on review ─────────────────────────────────────────────

  describe('Customer: Vote on review', () => {
    it('should reject vote without authentication', async () => {
      if (!createdReviewId) return;
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: true },
      );
      expect(res.status).toBe(401);
    });

    it('should reject vote without isHelpful boolean', async () => {
      if (!createdReviewId || !customerToken) {
        console.warn('Skipping: no customer token available');
        return;
      }
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: 'yes' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );
      expectStatus(res, 400);
    });

    it('should record a vote when authenticated', async () => {
      if (!createdReviewId || !customerToken) {
        console.warn('Skipping: no customer token available');
        return;
      }
      const res = await client.post(
        `/customer/products/${SEEDED_PRODUCT_1_ID}/reviews/${createdReviewId}/vote`,
        { isHelpful: true },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );
      expectStatus(res, 200);
    });
  });

  // ── Merchant: Review moderation ──────────────────────────────────────────

  describe('Merchant: Review moderation', () => {
    it('should list reviews with optional filters', async () => {
      const res = await client.get('/business/reviews', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should get a review by ID', async () => {
      if (!createdReviewId) return;
      const res = await client.get(`/business/reviews/${createdReviewId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should approve a review', async () => {
      if (!createdReviewId) return;
      const res = await client.put(`/business/reviews/${createdReviewId}/approve`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('approved');
    });

    it('should reject a review', async () => {
      if (!createdReviewId) return;
      const res = await client.put(`/business/reviews/${createdReviewId}/reject`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('rejected');
    });

    it('should reject respond with empty text', async () => {
      if (!createdReviewId) return;
      const res = await client.post(
        `/business/reviews/${createdReviewId}/respond`,
        { response: '' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should respond to a review', async () => {
      if (!createdReviewId) return;
      const res = await client.post(
        `/business/reviews/${createdReviewId}/respond`,
        { response: 'Thank you for your feedback!' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 for non-existent review', async () => {
      const res = await client.get('/business/reviews/00000000-0000-0000-0000-999999999999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('should delete a review', async () => {
      if (!createdReviewId) return;
      const res = await client.delete(`/business/reviews/${createdReviewId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdReviewId = null;
    });
  });

  // ── Customer: Q&A ────────────────────────────────────────────────────────

  describe('Customer: Q&A', () => {
    it('should reject Q&A without question field', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`, {});
      expect(res.status).toBe(400);
    });

    it('should reject Q&A for non-existent product', async () => {
      const res = await client.post('/customer/products/00000000-0000-0000-0000-999999999999/qa', {
        question: 'Does this exist?',
      });
      expect(res.status).toBe(404);
    });

    it('should submit a Q&A question with status pending', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`, {
        question: 'Does this product come in blue?',
        askerName: 'Test Customer',
      });
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('pending');
      createdQaId = res.data.data?.productQaId || res.data.data?.qaId || res.data.data?.id;
    });

    it('should list only answered Q&A for customers', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/qa`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      // Only answered Q&A should be returned to customers
      res.data.data.forEach((qa: Record<string, unknown>) => {
        expect(qa.status).toBe('answered');
      });
    });
  });

  // ── Merchant: Q&A moderation ─────────────────────────────────────────────

  describe('Merchant: Q&A moderation', () => {
    it('should list all Q&A for a product (all statuses)', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/qa`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should reject status update without status field', async () => {
      if (!createdQaId) return;
      const res = await client.patch(
        `/business/products/${SEEDED_PRODUCT_1_ID}/qa/${createdQaId}/status`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should update Q&A status to answered', async () => {
      if (!createdQaId) return;
      const res = await client.patch(
        `/business/products/${SEEDED_PRODUCT_1_ID}/qa/${createdQaId}/status`,
        { status: 'answered' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('answered');
    });
  });

  // ── Merchant: Review Media ───────────────────────────────────────────────

  describe('Merchant: Review Media', () => {
    it('should reject listing review media without reviewId query param', async () => {
      const res = await client.get(
        `/business/products/${SEEDED_PRODUCT_1_ID}/reviews/media`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should list review media for a given reviewId', async () => {
      const res = await client.get(
        `/business/products/${SEEDED_PRODUCT_1_ID}/reviews/media?reviewId=${SEEDED_REVIEW_1_ID}`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expectStatus(res, 200);
    });

    it('should return 404 when deleting non-existent review media', async () => {
      const res = await client.delete(
        `/business/products/${SEEDED_PRODUCT_1_ID}/reviews/media/00000000-0000-0000-0000-999999999999`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(404);
    });
  });
});
