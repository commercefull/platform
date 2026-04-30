# Product – Merchant: Reviews & Q&A EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/infrastructure/repositories/productReviewRepo.ts`, `modules/product/infrastructure/repositories/productQaRepo.ts`

---

## Context

Merchants moderate customer-submitted reviews and Q&A questions. Reviews go through a `pending → approved | rejected` workflow. Q&A questions go through `pending → approved`. Only `approved` records are visible to customers.

### Review Status Lifecycle

```
Customer submits  →  pending
Merchant approves →  approved  (visible to customers)
Merchant rejects  →  rejected  (hidden from customers)
```

### Q&A Status Lifecycle

```
Customer submits  →  pending
Merchant approves →  approved  (visible to customers)
```

---

## 1. Ubiquitous Requirements

The system shall record `createdAt` and `updatedAt` on every review and Q&A record.

The system shall expose only `approved` reviews and Q&A entries to customer-facing endpoints.

---

## 2. Event-Driven Requirements

### 2.1 Review Management

When an authenticated merchant calls `GET /business/reviews`, the system shall return reviews. Optional filters: `productId`, `status`, `limit`, `offset`.

When an authenticated merchant calls `GET /business/reviews/:reviewId`, the system shall return the review.

When an authenticated merchant calls `PUT /business/reviews/:reviewId/approve`, the system shall set the review status to `approved` and return the updated review.

When an authenticated merchant calls `PUT /business/reviews/:reviewId/reject`, the system shall set the review status to `rejected` and return the updated review.

When an authenticated merchant calls `POST /business/reviews/:reviewId/respond` with a non-empty response text, the system shall attach the admin response to the review and return the updated review.

When an authenticated merchant calls `DELETE /business/reviews/:reviewId`, the system shall permanently remove the review.

When an authenticated merchant calls `GET /business/products/:productId/reviews/media`, the system shall return all media attachments for reviews of that product, filtered by `reviewId`.

When an authenticated merchant calls `DELETE /business/products/:productId/reviews/media/:mediaId`, the system shall permanently remove the review media record.

### 2.2 Q&A Management

When an authenticated merchant calls `GET /business/products/:productId/qa`, the system shall return all Q&A entries for the product. An optional `status` query parameter filters by status.

When an authenticated merchant calls `PATCH /business/products/:productId/qa/:qaId/status` with a valid status, the system shall update the Q&A entry's status and return the updated record.

---

## 3. Unwanted Behaviour / Edge Cases

If a merchant attempts to respond to a review with an empty response text, the system shall reject with HTTP 400: `"Response text is required"`.

If a merchant requests a review that does not exist, the system shall return HTTP 404.

If a merchant requests a Q&A entry that does not exist, the system shall return HTTP 404.

If a merchant requests review media that does not exist, the system shall return HTTP 404.

If a merchant calls `PATCH /business/products/:productId/qa/:qaId/status` without a `status` field, the system shall reject with HTTP 400: `"status is required"`.

---

## 8. Use Case Traceability

| Requirement                              | Controller / Repo           | Source File                                                                    |
| ---------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| List / get reviews                       | `ProductBusinessController` | `modules/product/interface/controllers/ProductBusinessController.ts`           |
| Approve / reject review                  | `productReviewRepo`         | `modules/product/infrastructure/repositories/productReviewRepo.ts`             |
| Add admin response to review             | `productReviewRepo`         | `modules/product/infrastructure/repositories/productReviewRepo.ts`             |
| Delete review                            | `productReviewRepo`         | `modules/product/infrastructure/repositories/productReviewRepo.ts`             |
| List / delete review media               | `productReviewMediaRepo`    | `modules/product/infrastructure/repositories/productReviewMediaRepo.ts`        |
| List Q&A (business)                      | `productQaRepo`             | `modules/product/infrastructure/repositories/productQaRepo.ts`                 |
| Update Q&A status                        | `productQaRepo`             | `modules/product/infrastructure/repositories/productQaRepo.ts`                 |
