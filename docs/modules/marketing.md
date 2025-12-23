# Marketing Feature

## Overview

The Marketing feature manages email campaigns, abandoned cart recovery, product recommendations, and affiliate programs. It enables targeted marketing automation and partner revenue sharing.

---

## Use Cases

### Email Campaigns (Business)

### UC-MKT-001: List Campaigns (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request campaigns  
**Then** the system returns all email campaigns

#### API Endpoint

```
GET /business/marketing/campaigns
Query: status?, type?, limit, offset
```

---

### UC-MKT-002: Get Campaign (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint

```
GET /business/marketing/campaigns/:id
```

---

### UC-MKT-003: Create Campaign (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid campaign data  
**When** they create a campaign  
**Then** the campaign is created

#### API Endpoint

```
POST /business/marketing/campaigns
Body: {
  name, subject, templateId,
  type: 'promotional'|'newsletter'|'transactional',
  scheduledAt?, segmentId?
}
```

#### Business Rules

- Can schedule for future delivery
- Can target customer segments
- Requires email template

---

### UC-MKT-004: Update Campaign (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/marketing/campaigns/:id
```

---

### UC-MKT-005: Delete Campaign (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/marketing/campaigns/:id
```

---

### UC-MKT-006: Get Campaign Recipients (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/campaigns/:id/recipients
```

---

### UC-MKT-007: Add Campaign Recipients (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/marketing/campaigns/:id/recipients
Body: { customerIds?: [], segmentId?, all?: boolean }
```

---

### Email Templates (Business)

### UC-MKT-008: List Templates (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/templates
```

---

### UC-MKT-009: Get Template (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/templates/:id
```

---

### UC-MKT-010: Create Template (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/marketing/templates
Body: { name, subject, htmlContent, textContent?, variables: [] }
```

---

### UC-MKT-011: Update Template (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/marketing/templates/:id
```

---

### UC-MKT-012: Delete Template (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/marketing/templates/:id
```

---

### Abandoned Carts (Business)

### UC-MKT-013: List Abandoned Carts (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request abandoned carts  
**Then** the system returns carts not converted

#### API Endpoint

```
GET /business/marketing/abandoned-carts
Query: minValue?, daysOld?, recovered?, limit, offset
```

---

### UC-MKT-014: Get Abandoned Cart (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/abandoned-carts/:id
```

---

### UC-MKT-015: Get Abandoned Cart Stats (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request abandoned cart statistics  
**Then** the system returns recovery metrics

#### API Endpoint

```
GET /business/marketing/abandoned-carts/stats
```

---

### Product Recommendations (Business)

### UC-MKT-016: List Recommendations (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/recommendations
Query: type?, productId?, limit, offset
```

---

### UC-MKT-017: Create Recommendation (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** product relationships  
**When** creating a recommendation  
**Then** products are linked for cross-sell

#### API Endpoint

```
POST /business/marketing/recommendations
Body: {
  sourceProductId, targetProductId,
  type: 'cross_sell'|'upsell'|'frequently_bought',
  priority?
}
```

---

### UC-MKT-018: Delete Recommendation (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/marketing/recommendations/:id
```

---

### UC-MKT-019: Compute Recommendations (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** order history data  
**When** computing recommendations  
**Then** AI-generated recommendations are created

#### API Endpoint

```
POST /business/marketing/recommendations/compute
```

---

### UC-MKT-020: Get Product View Stats (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
GET /business/marketing/products/:productId/view-stats
```

---

### Affiliate Program (Business)

### UC-MKT-021: List Affiliates (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request affiliates  
**Then** the system returns all affiliate partners

#### API Endpoint

```
GET /business/marketing/affiliates
Query: status?, limit, offset
```

---

### UC-MKT-022: Get Affiliate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/affiliates/:id
```

---

### UC-MKT-023: Update Affiliate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/marketing/affiliates/:id
Body: { commissionRate?, paymentThreshold?, notes? }
```

---

### UC-MKT-024: Approve Affiliate (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a pending affiliate application  
**When** approving the affiliate  
**Then** they can start earning commissions

#### API Endpoint

```
POST /business/marketing/affiliates/:id/approve
```

---

### UC-MKT-025: Reject Affiliate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/marketing/affiliates/:id/reject
Body: { reason }
```

---

### UC-MKT-026: Suspend Affiliate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/marketing/affiliates/:id/suspend
Body: { reason }
```

---

### UC-MKT-027: Get Affiliate Commissions (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/marketing/affiliates/:id/commissions
Query: status?, dateFrom?, dateTo?, limit, offset
```

---

### UC-MKT-028: Approve Commission (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint

```
POST /business/marketing/commissions/:commissionId/approve
```

---

### UC-MKT-029: Reject Commission (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/marketing/commissions/:commissionId/reject
Body: { reason }
```

---

## Events Emitted

| Event                | Trigger                  | Payload                           |
| -------------------- | ------------------------ | --------------------------------- |
| `campaign.created`   | Campaign created         | campaignId                        |
| `campaign.sent`      | Campaign sent            | campaignId, recipientCount        |
| `campaign.opened`    | Email opened             | campaignId, customerId            |
| `campaign.clicked`   | Link clicked             | campaignId, customerId, link      |
| `cart.abandoned`     | Cart abandoned           | cartId, customerId                |
| `cart.recovered`     | Abandoned cart converted | cartId, orderId                   |
| `affiliate.applied`  | Affiliate application    | affiliateId                       |
| `affiliate.approved` | Affiliate approved       | affiliateId                       |
| `commission.earned`  | Commission earned        | commissionId, affiliateId, amount |
| `commission.paid`    | Commission paid          | commissionId, affiliateId         |

---

## Integration Test Coverage

| Use Case                 | Test File                           | Status |
| ------------------------ | ----------------------------------- | ------ |
| UC-MKT-001 to UC-MKT-007 | `marketing/campaigns.test.ts`       | ❌     |
| UC-MKT-008 to UC-MKT-012 | `marketing/templates.test.ts`       | ❌     |
| UC-MKT-013 to UC-MKT-015 | `marketing/abandoned.test.ts`       | ❌     |
| UC-MKT-016 to UC-MKT-020 | `marketing/recommendations.test.ts` | ❌     |
| UC-MKT-021 to UC-MKT-029 | `marketing/affiliates.test.ts`      | ❌     |
