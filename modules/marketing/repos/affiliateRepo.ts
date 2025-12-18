/**
 * Affiliate & Referral Repository
 * Handles CRUD operations for affiliate program and referrals
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'rejected' | 'closed';
export type AffiliateTier = 'standard' | 'silver' | 'gold' | 'platinum';
export type CommissionType = 'percentage' | 'fixed' | 'tiered';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'paypal' | 'bank_transfer' | 'check' | 'store_credit';
export type ReferralStatus = 'pending' | 'signed_up' | 'purchased' | 'rewarded' | 'expired' | 'cancelled';
export type RewardType = 'discount' | 'credit' | 'points' | 'free_shipping' | 'free_product' | 'cash';
export type RewardStatus = 'pending' | 'issued' | 'claimed' | 'expired' | 'cancelled';

export interface Affiliate {
  affiliateId: string;
  customerId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  socialMedia?: string;
  affiliateCode: string;
  status: AffiliateStatus;
  tier: AffiliateTier;
  commissionRate: number;
  commissionType: CommissionType;
  cookieDurationDays: number;
  lifetimeEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  totalPaidOut: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  averageOrderValue: number;
  paymentMethod?: PaymentMethod;
  paypalEmail?: string;
  bankDetails?: Record<string, any>;
  minimumPayout: number;
  currency: string;
  bio?: string;
  categories?: string[];
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AffiliateLink {
  affiliateLinkId: string;
  affiliateId: string;
  name?: string;
  shortCode: string;
  destinationUrl: string;
  productId?: string;
  productCategoryId?: string;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clickCount: number;
  uniqueClickCount: number;
  conversionCount: number;
  revenue: number;
  commission: number;
  isActive: boolean;
  lastClickedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateCommission {
  affiliateCommissionId: string;
  affiliateId: string;
  affiliateLinkId?: string;
  orderId: string;
  customerId?: string;
  orderTotal: number;
  commissionableAmount: number;
  commissionRate: number;
  commissionType: CommissionType;
  commissionAmount: number;
  currency: string;
  status: CommissionStatus;
  isFirstOrder: boolean;
  notes?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;
  payoutId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliatePayout {
  affiliatePayoutId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PayoutStatus;
  paypalEmail?: string;
  paypalTransactionId?: string;
  bankDetails?: Record<string, any>;
  bankReference?: string;
  checkNumber?: string;
  storeCreditCode?: string;
  commissionsCount: number;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  failureReason?: string;
  processedAt?: Date;
  processedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  referralId: string;
  referrerId: string;
  referredId?: string;
  referralCode: string;
  referredEmail?: string;
  referredFirstName?: string;
  status: ReferralStatus;
  firstOrderId?: string;
  firstOrderValue?: number;
  source?: string;
  channel?: string;
  invitedAt?: Date;
  signedUpAt?: Date;
  purchasedAt?: Date;
  rewardedAt?: Date;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralReward {
  referralRewardId: string;
  referralId: string;
  customerId: string;
  recipientType: 'referrer' | 'referred';
  rewardType: RewardType;
  rewardValue: number;
  currency: string;
  discountCode?: string;
  pointsAwarded?: number;
  freeProductId?: string;
  status: RewardStatus;
  issuedAt?: Date;
  claimedAt?: Date;
  claimedOrderId?: string;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Affiliate CRUD
// ============================================================================

export async function getAffiliate(affiliateId: string): Promise<Affiliate | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingAffiliate" WHERE "marketingAffiliateId" = $1 AND "deletedAt" IS NULL',
    [affiliateId]
  );
  return row ? mapToAffiliate(row) : null;
}

export async function getAffiliateByCode(affiliateCode: string): Promise<Affiliate | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingAffiliate" WHERE "affiliateCode" = $1 AND "deletedAt" IS NULL',
    [affiliateCode]
  );
  return row ? mapToAffiliate(row) : null;
}

export async function getAffiliateByEmail(email: string): Promise<Affiliate | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingAffiliate" WHERE "email" = $1 AND "deletedAt" IS NULL',
    [email]
  );
  return row ? mapToAffiliate(row) : null;
}

export async function getAffiliates(
  filters?: { status?: AffiliateStatus; tier?: AffiliateTier },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: Affiliate[]; total: number }> {
  let whereClause = '"deletedAt" IS NULL';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.tier) {
    whereClause += ` AND "tier" = $${paramIndex++}`;
    params.push(filters.tier);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "marketingAffiliate" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingAffiliate" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToAffiliate),
    total: parseInt(countResult?.count || '0')
  };
}

export async function saveAffiliate(affiliate: Partial<Affiliate> & { email: string }): Promise<Affiliate> {
  const now = new Date().toISOString();

  if (affiliate.affiliateId) {
    await query(
      `UPDATE "marketingAffiliate" SET
        "firstName" = $1, "lastName" = $2, "companyName" = $3, "website" = $4,
        "socialMedia" = $5, "status" = $6, "tier" = $7, "commissionRate" = $8,
        "commissionType" = $9, "cookieDurationDays" = $10, "paymentMethod" = $11,
        "paypalEmail" = $12, "bankDetails" = $13, "minimumPayout" = $14, "bio" = $15,
        "categories" = $16, "updatedAt" = $17
      WHERE "marketingAffiliateId" = $18`,
      [
        affiliate.firstName, affiliate.lastName, affiliate.companyName, affiliate.website,
        affiliate.socialMedia, affiliate.status || 'pending', affiliate.tier || 'standard',
        affiliate.commissionRate || 10, affiliate.commissionType || 'percentage',
        affiliate.cookieDurationDays || 30, affiliate.paymentMethod, affiliate.paypalEmail,
        affiliate.bankDetails ? JSON.stringify(affiliate.bankDetails) : null,
        affiliate.minimumPayout || 50, affiliate.bio,
        affiliate.categories ? JSON.stringify(affiliate.categories) : null,
        now, affiliate.affiliateId
      ]
    );
    return (await getAffiliate(affiliate.affiliateId))!;
  } else {
    // Generate unique affiliate code
    const code = affiliate.affiliateCode || generateAffiliateCode();
    
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "marketingAffiliate" (
        "customerId", "email", "firstName", "lastName", "companyName", "website",
        "socialMedia", "affiliateCode", "status", "tier", "commissionRate", "commissionType",
        "cookieDurationDays", "minimumPayout", "currency", "bio", "categories",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        affiliate.customerId, affiliate.email, affiliate.firstName, affiliate.lastName,
        affiliate.companyName, affiliate.website, affiliate.socialMedia, code,
        'pending', 'standard', affiliate.commissionRate || 10, 'percentage',
        affiliate.cookieDurationDays || 30, affiliate.minimumPayout || 50,
        affiliate.currency || 'USD', affiliate.bio,
        affiliate.categories ? JSON.stringify(affiliate.categories) : null,
        now, now
      ]
    );
    return mapToAffiliate(result!);
  }
}

export async function approveAffiliate(affiliateId: string, approvedBy: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "marketingAffiliate" SET "status" = 'active', "approvedAt" = $1, "approvedBy" = $2, "updatedAt" = $1
     WHERE "marketingAffiliateId" = $3`,
    [now, approvedBy, affiliateId]
  );
}

export async function rejectAffiliate(affiliateId: string, reason: string): Promise<void> {
  await query(
    `UPDATE "marketingAffiliate" SET "status" = 'rejected', "rejectionReason" = $1, "updatedAt" = $2
     WHERE "marketingAffiliateId" = $3`,
    [reason, new Date().toISOString(), affiliateId]
  );
}

export async function suspendAffiliate(affiliateId: string): Promise<void> {
  await query(
    `UPDATE "marketingAffiliate" SET "status" = 'suspended', "updatedAt" = $1 WHERE "marketingAffiliateId" = $2`,
    [new Date().toISOString(), affiliateId]
  );
}

export async function updateAffiliateStats(affiliateId: string): Promise<void> {
  await query(
    `UPDATE "marketingAffiliate" SET
      "totalClicks" = (SELECT COALESCE(SUM("clickCount"), 0) FROM "marketingAffiliateLink" WHERE "marketingAffiliateId" = $1),
      "totalConversions" = (SELECT COUNT(*) FROM "marketingAffiliateCommission" WHERE "marketingAffiliateId" = $1 AND "status" != 'rejected'),
      "lifetimeEarnings" = (SELECT COALESCE(SUM("commissionAmount"), 0) FROM "marketingAffiliateCommission" WHERE "marketingAffiliateId" = $1 AND "status" IN ('approved', 'paid')),
      "pendingBalance" = (SELECT COALESCE(SUM("commissionAmount"), 0) FROM "marketingAffiliateCommission" WHERE "marketingAffiliateId" = $1 AND "status" = 'pending'),
      "availableBalance" = (SELECT COALESCE(SUM("commissionAmount"), 0) FROM "marketingAffiliateCommission" WHERE "marketingAffiliateId" = $1 AND "status" = 'approved'),
      "updatedAt" = $2
    WHERE "marketingAffiliateId" = $1`,
    [affiliateId, new Date().toISOString()]
  );
}

// ============================================================================
// Affiliate Links
// ============================================================================

export async function getAffiliateLink(affiliateLinkId: string): Promise<AffiliateLink | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingAffiliateLink" WHERE "affiliateLinkId" = $1',
    [affiliateLinkId]
  );
  return row ? mapToAffiliateLink(row) : null;
}

export async function getAffiliateLinkByCode(shortCode: string): Promise<AffiliateLink | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "marketingAffiliateLink" WHERE "shortCode" = $1',
    [shortCode]
  );
  return row ? mapToAffiliateLink(row) : null;
}

export async function getAffiliateLinks(affiliateId: string): Promise<AffiliateLink[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "marketingAffiliateLink" WHERE "marketingAffiliateId" = $1 ORDER BY "createdAt" DESC',
    [affiliateId]
  );
  return (rows || []).map(mapToAffiliateLink);
}

export async function saveAffiliateLink(link: Partial<AffiliateLink> & {
  affiliateId: string;
  destinationUrl: string;
}): Promise<AffiliateLink> {
  const now = new Date().toISOString();

  if (link.affiliateLinkId) {
    await query(
      `UPDATE "marketingAffiliateLink" SET
        "name" = $1, "destinationUrl" = $2, "productId" = $3, "productCategoryId" = $4,
        "utmSource" = $5, "utmMedium" = $6, "utmCampaign" = $7, "isActive" = $8, "updatedAt" = $9
      WHERE "affiliateLinkId" = $10`,
      [
        link.name, link.destinationUrl, link.productId, link.productCategoryId,
        link.utmSource, link.utmMedium, link.utmCampaign, link.isActive !== false,
        now, link.affiliateLinkId
      ]
    );
    return (await getAffiliateLink(link.affiliateLinkId))!;
  } else {
    const shortCode = link.shortCode || generateShortCode();
    
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "marketingAffiliateLink" (
        "affiliateId", "name", "shortCode", "destinationUrl", "productId", "productCategoryId",
        "utmSource", "utmMedium", "utmCampaign", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        link.affiliateId, link.name, shortCode, link.destinationUrl,
        link.productId, link.productCategoryId, link.utmSource, link.utmMedium,
        link.utmCampaign, true, now, now
      ]
    );
    return mapToAffiliateLink(result!);
  }
}

export async function recordLinkClick(affiliateLinkId: string, isUnique: boolean): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "marketingAffiliateLink" SET 
      "clickCount" = "clickCount" + 1,
      "uniqueClickCount" = "uniqueClickCount" + $1,
      "lastClickedAt" = $2,
      "updatedAt" = $2
     WHERE "affiliateLinkId" = $3`,
    [isUnique ? 1 : 0, now, affiliateLinkId]
  );
}

// ============================================================================
// Commissions
// ============================================================================

export async function createCommission(commission: {
  affiliateId: string;
  affiliateLinkId?: string;
  orderId: string;
  customerId?: string;
  orderTotal: number;
  commissionableAmount: number;
  commissionRate: number;
  commissionType: CommissionType;
  commissionAmount: number;
  currency?: string;
  isFirstOrder?: boolean;
}): Promise<AffiliateCommission> {
  const now = new Date().toISOString();
  
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "marketingAffiliateCommission" (
      "affiliateId", "affiliateLinkId", "orderId", "customerId", "orderTotal",
      "commissionableAmount", "commissionRate", "commissionType", "commissionAmount",
      "currency", "status", "isFirstOrder", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13)
    RETURNING *`,
    [
      commission.affiliateId, commission.affiliateLinkId, commission.orderId,
      commission.customerId, commission.orderTotal, commission.commissionableAmount,
      commission.commissionRate, commission.commissionType, commission.commissionAmount,
      commission.currency || 'USD', commission.isFirstOrder || false, now, now
    ]
  );

  // Update affiliate stats
  await updateAffiliateStats(commission.affiliateId);

  return mapToCommission(result!);
}

export async function getCommissions(
  affiliateId: string,
  filters?: { status?: CommissionStatus },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: AffiliateCommission[]; total: number }> {
  let whereClause = '"marketingAffiliateId" = $1';
  const params: any[] = [affiliateId];
  let paramIndex = 2;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "marketingAffiliateCommission" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "marketingAffiliateCommission" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToCommission),
    total: parseInt(countResult?.count || '0')
  };
}

export async function approveCommission(affiliateCommissionId: string, approvedBy: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "marketingAffiliateCommission" SET "status" = 'approved', "approvedAt" = $1, "approvedBy" = $2, "updatedAt" = $1
     WHERE "affiliateCommissionId" = $3`,
    [now, approvedBy, affiliateCommissionId]
  );
}

export async function rejectCommission(affiliateCommissionId: string, reason: string): Promise<void> {
  await query(
    `UPDATE "marketingAffiliateCommission" SET "status" = 'rejected', "rejectionReason" = $1, "updatedAt" = $2
     WHERE "affiliateCommissionId" = $3`,
    [reason, new Date().toISOString(), affiliateCommissionId]
  );
}

// ============================================================================
// Referrals
// ============================================================================

export async function getReferral(referralId: string): Promise<Referral | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "referral" WHERE "referralId" = $1',
    [referralId]
  );
  return row ? mapToReferral(row) : null;
}

export async function getReferralByCode(referralCode: string): Promise<Referral | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "referral" WHERE "referralCode" = $1 AND "status" = \'pending\'',
    [referralCode]
  );
  return row ? mapToReferral(row) : null;
}

export async function getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "referral" WHERE "referrerId" = $1 ORDER BY "createdAt" DESC',
    [referrerId]
  );
  return (rows || []).map(mapToReferral);
}

export async function createReferral(referral: {
  referrerId: string;
  referralCode: string;
  referredEmail?: string;
  referredFirstName?: string;
  source?: string;
  channel?: string;
  expiresAt?: Date;
}): Promise<Referral> {
  const now = new Date().toISOString();
  
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "referral" (
      "referrerId", "referralCode", "referredEmail", "referredFirstName", "status",
      "source", "channel", "invitedAt", "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      referral.referrerId, referral.referralCode, referral.referredEmail,
      referral.referredFirstName, referral.source, referral.channel,
      now, referral.expiresAt?.toISOString(), now, now
    ]
  );

  return mapToReferral(result!);
}

export async function markReferralSignedUp(referralId: string, referredId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "referral" SET "status" = 'signed_up', "referredId" = $1, "signedUpAt" = $2, "updatedAt" = $2
     WHERE "referralId" = $3`,
    [referredId, now, referralId]
  );
}

export async function markReferralPurchased(referralId: string, orderId: string, orderValue: number): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "referral" SET "status" = 'purchased', "firstOrderId" = $1, "firstOrderValue" = $2, 
     "purchasedAt" = $3, "updatedAt" = $3
     WHERE "referralId" = $4`,
    [orderId, orderValue, now, referralId]
  );
}

export async function markReferralRewarded(referralId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "referral" SET "status" = 'rewarded', "rewardedAt" = $1, "updatedAt" = $1
     WHERE "referralId" = $2`,
    [now, referralId]
  );
}

// ============================================================================
// Referral Rewards
// ============================================================================

export async function createReferralReward(reward: {
  referralId: string;
  customerId: string;
  recipientType: 'referrer' | 'referred';
  rewardType: RewardType;
  rewardValue: number;
  currency?: string;
  discountCode?: string;
  pointsAwarded?: number;
  freeProductId?: string;
  expiresAt?: Date;
}): Promise<ReferralReward> {
  const now = new Date().toISOString();
  
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "referralReward" (
      "referralId", "customerId", "recipientType", "rewardType", "rewardValue",
      "currency", "discountCode", "pointsAwarded", "freeProductId", "status",
      "issuedAt", "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'issued', $10, $11, $12, $13)
    RETURNING *`,
    [
      reward.referralId, reward.customerId, reward.recipientType, reward.rewardType,
      reward.rewardValue, reward.currency || 'USD', reward.discountCode,
      reward.pointsAwarded, reward.freeProductId, now, reward.expiresAt?.toISOString(),
      now, now
    ]
  );

  return mapToReferralReward(result!);
}

export async function claimReward(referralRewardId: string, orderId?: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "referralReward" SET "status" = 'claimed', "claimedAt" = $1, "claimedOrderId" = $2, "updatedAt" = $1
     WHERE "referralRewardId" = $3`,
    [now, orderId, referralRewardId]
  );
}

// ============================================================================
// Helpers
// ============================================================================

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapToAffiliate(row: Record<string, any>): Affiliate {
  return {
    affiliateId: row.marketingAffiliateId,
    customerId: row.customerId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    companyName: row.companyName,
    website: row.website,
    socialMedia: row.socialMedia,
    affiliateCode: row.affiliateCode,
    status: row.status,
    tier: row.tier,
    commissionRate: parseFloat(row.commissionRate) || 10,
    commissionType: row.commissionType,
    cookieDurationDays: parseInt(row.cookieDurationDays) || 30,
    lifetimeEarnings: parseFloat(row.lifetimeEarnings) || 0,
    pendingBalance: parseFloat(row.pendingBalance) || 0,
    availableBalance: parseFloat(row.availableBalance) || 0,
    totalPaidOut: parseFloat(row.totalPaidOut) || 0,
    totalClicks: parseInt(row.totalClicks) || 0,
    totalConversions: parseInt(row.totalConversions) || 0,
    conversionRate: parseFloat(row.conversionRate) || 0,
    averageOrderValue: parseFloat(row.averageOrderValue) || 0,
    paymentMethod: row.paymentMethod,
    paypalEmail: row.paypalEmail,
    bankDetails: row.bankDetails,
    minimumPayout: parseFloat(row.minimumPayout) || 50,
    currency: row.currency || 'USD',
    bio: row.bio,
    categories: row.categories,
    rejectionReason: row.rejectionReason,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
    approvedBy: row.approvedBy,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
  };
}

function mapToAffiliateLink(row: Record<string, any>): AffiliateLink {
  return {
    affiliateLinkId: row.marketingAffiliateLinkId,
    affiliateId: row.marketingAffiliateId,
    name: row.name,
    shortCode: row.shortCode,
    destinationUrl: row.destinationUrl,
    productId: row.productId,
    productCategoryId: row.productCategoryId,
    campaignId: row.campaignId,
    utmSource: row.utmSource,
    utmMedium: row.utmMedium,
    utmCampaign: row.utmCampaign,
    clickCount: parseInt(row.clickCount) || 0,
    uniqueClickCount: parseInt(row.uniqueClickCount) || 0,
    conversionCount: parseInt(row.conversionCount) || 0,
    revenue: parseFloat(row.revenue) || 0,
    commission: parseFloat(row.commission) || 0,
    isActive: Boolean(row.isActive),
    lastClickedAt: row.lastClickedAt ? new Date(row.lastClickedAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToCommission(row: Record<string, any>): AffiliateCommission {
  return {
    affiliateCommissionId: row.marketingAffiliateCommissionId,
    affiliateId: row.marketingAffiliateId,
    affiliateLinkId: row.marketingAffiliateLinkId,
    orderId: row.orderId,
    customerId: row.customerId,
    orderTotal: parseFloat(row.orderTotal) || 0,
    commissionableAmount: parseFloat(row.commissionableAmount) || 0,
    commissionRate: parseFloat(row.commissionRate) || 0,
    commissionType: row.commissionType,
    commissionAmount: parseFloat(row.commissionAmount) || 0,
    currency: row.currency || 'USD',
    status: row.status,
    isFirstOrder: Boolean(row.isFirstOrder),
    notes: row.notes,
    rejectionReason: row.rejectionReason,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
    approvedBy: row.approvedBy,
    payoutId: row.payoutId,
    paidAt: row.paidAt ? new Date(row.paidAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToReferral(row: Record<string, any>): Referral {
  return {
    referralId: row.referralId,
    referrerId: row.referrerId,
    referredId: row.referredId,
    referralCode: row.referralCode,
    referredEmail: row.referredEmail,
    referredFirstName: row.referredFirstName,
    status: row.status,
    firstOrderId: row.firstOrderId,
    firstOrderValue: row.firstOrderValue ? parseFloat(row.firstOrderValue) : undefined,
    source: row.source,
    channel: row.channel,
    invitedAt: row.invitedAt ? new Date(row.invitedAt) : undefined,
    signedUpAt: row.signedUpAt ? new Date(row.signedUpAt) : undefined,
    purchasedAt: row.purchasedAt ? new Date(row.purchasedAt) : undefined,
    rewardedAt: row.rewardedAt ? new Date(row.rewardedAt) : undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToReferralReward(row: Record<string, any>): ReferralReward {
  return {
    referralRewardId: row.referralRewardId,
    referralId: row.referralId,
    customerId: row.customerId,
    recipientType: row.recipientType,
    rewardType: row.rewardType,
    rewardValue: parseFloat(row.rewardValue) || 0,
    currency: row.currency || 'USD',
    discountCode: row.discountCode,
    pointsAwarded: row.pointsAwarded ? parseInt(row.pointsAwarded) : undefined,
    freeProductId: row.freeProductId,
    status: row.status,
    issuedAt: row.issuedAt ? new Date(row.issuedAt) : undefined,
    claimedAt: row.claimedAt ? new Date(row.claimedAt) : undefined,
    claimedOrderId: row.claimedOrderId,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    notes: row.notes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
