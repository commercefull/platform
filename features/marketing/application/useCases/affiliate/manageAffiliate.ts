/**
 * Manage Affiliate Use Cases
 * Admin operations for affiliate management
 */

import * as affiliateRepo from '../../../repos/affiliateRepo';

// List Affiliates
export interface ListAffiliatesInput {
  status?: 'pending' | 'active' | 'suspended' | 'rejected' | 'closed';
  tier?: 'standard' | 'silver' | 'gold' | 'platinum';
  limit?: number;
  offset?: number;
}

export interface ListAffiliatesOutput {
  data: affiliateRepo.Affiliate[];
  total: number;
}

export async function listAffiliates(input: ListAffiliatesInput): Promise<ListAffiliatesOutput> {
  return affiliateRepo.getAffiliates(
    { status: input.status, tier: input.tier },
    { limit: input.limit || 20, offset: input.offset || 0 }
  );
}

// Get Affiliate
export interface GetAffiliateInput {
  affiliateId: string;
}

export interface GetAffiliateOutput {
  affiliate: affiliateRepo.Affiliate;
}

export async function getAffiliate(input: GetAffiliateInput): Promise<GetAffiliateOutput> {
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }
  return { affiliate };
}

// Update Affiliate
export interface UpdateAffiliateInput {
  affiliateId: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  socialMedia?: string;
  tier?: 'standard' | 'silver' | 'gold' | 'platinum';
  commissionRate?: number;
  commissionType?: 'percentage' | 'fixed' | 'tiered';
  cookieDurationDays?: number;
  paymentMethod?: 'paypal' | 'bank_transfer' | 'check' | 'store_credit';
  paypalEmail?: string;
  bankDetails?: Record<string, any>;
  minimumPayout?: number;
  bio?: string;
  categories?: string[];
}

export interface UpdateAffiliateOutput {
  affiliate: affiliateRepo.Affiliate;
}

export async function updateAffiliate(input: UpdateAffiliateInput): Promise<UpdateAffiliateOutput> {
  const existing = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!existing) {
    throw new Error('Affiliate not found');
  }

  const affiliate = await affiliateRepo.saveAffiliate({
    affiliateId: input.affiliateId,
    email: existing.email,
    firstName: input.firstName ?? existing.firstName,
    lastName: input.lastName ?? existing.lastName,
    companyName: input.companyName ?? existing.companyName,
    website: input.website ?? existing.website,
    socialMedia: input.socialMedia ?? existing.socialMedia,
    tier: input.tier ?? existing.tier,
    commissionRate: input.commissionRate ?? existing.commissionRate,
    commissionType: input.commissionType ?? existing.commissionType,
    cookieDurationDays: input.cookieDurationDays ?? existing.cookieDurationDays,
    paymentMethod: input.paymentMethod ?? existing.paymentMethod,
    paypalEmail: input.paypalEmail ?? existing.paypalEmail,
    bankDetails: input.bankDetails ?? existing.bankDetails,
    minimumPayout: input.minimumPayout ?? existing.minimumPayout,
    bio: input.bio ?? existing.bio,
    categories: input.categories ?? existing.categories
  });

  return { affiliate };
}

// Approve Affiliate
export interface ApproveAffiliateInput {
  affiliateId: string;
  approvedBy: string;
}

export async function approveAffiliate(input: ApproveAffiliateInput): Promise<void> {
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  if (affiliate.status !== 'pending') {
    throw new Error('Can only approve pending affiliates');
  }

  await affiliateRepo.approveAffiliate(input.affiliateId, input.approvedBy);
}

// Reject Affiliate
export interface RejectAffiliateInput {
  affiliateId: string;
  reason: string;
}

export async function rejectAffiliate(input: RejectAffiliateInput): Promise<void> {
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  if (affiliate.status !== 'pending') {
    throw new Error('Can only reject pending affiliates');
  }

  if (!input.reason?.trim()) {
    throw new Error('Rejection reason is required');
  }

  await affiliateRepo.rejectAffiliate(input.affiliateId, input.reason);
}

// Suspend Affiliate
export interface SuspendAffiliateInput {
  affiliateId: string;
}

export async function suspendAffiliate(input: SuspendAffiliateInput): Promise<void> {
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  if (affiliate.status !== 'active') {
    throw new Error('Can only suspend active affiliates');
  }

  await affiliateRepo.suspendAffiliate(input.affiliateId);
}
