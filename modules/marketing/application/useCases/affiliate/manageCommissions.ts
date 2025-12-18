/**
 * Manage Affiliate Commissions Use Cases
 */

import * as affiliateRepo from '../../../repos/affiliateRepo';

// List Commissions
export interface ListCommissionsInput {
  affiliateId: string;
  status?: 'pending' | 'approved' | 'paid' | 'rejected' | 'refunded';
  limit?: number;
  offset?: number;
}

export interface ListCommissionsOutput {
  data: affiliateRepo.AffiliateCommission[];
  total: number;
}

export async function listCommissions(input: ListCommissionsInput): Promise<ListCommissionsOutput> {
  return affiliateRepo.getCommissions(
    input.affiliateId,
    { status: input.status },
    { limit: input.limit || 20, offset: input.offset || 0 }
  );
}

// Create Commission (when an order is placed via affiliate link)
export interface CreateCommissionInput {
  affiliateId: string;
  affiliateLinkId?: string;
  orderId: string;
  customerId?: string;
  orderTotal: number;
  commissionableAmount: number;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  commissionAmount: number;
  currency?: string;
  isFirstOrder?: boolean;
}

export interface CreateCommissionOutput {
  commission: affiliateRepo.AffiliateCommission;
}

export async function createCommission(input: CreateCommissionInput): Promise<CreateCommissionOutput> {
  // Validate affiliate exists
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  if (affiliate.status !== 'active') {
    throw new Error('Cannot create commission for inactive affiliate');
  }

  const commission = await affiliateRepo.createCommission({
    affiliateId: input.affiliateId,
    affiliateLinkId: input.affiliateLinkId,
    orderId: input.orderId,
    customerId: input.customerId,
    orderTotal: input.orderTotal,
    commissionableAmount: input.commissionableAmount,
    commissionRate: input.commissionRate,
    commissionType: input.commissionType,
    commissionAmount: input.commissionAmount,
    currency: input.currency || 'USD',
    isFirstOrder: input.isFirstOrder
  });

  // Update affiliate stats
  await affiliateRepo.updateAffiliateStats(input.affiliateId);

  return { commission };
}

// Approve Commission
export interface ApproveCommissionInput {
  commissionId: string;
  approvedBy: string;
}

export async function approveCommission(input: ApproveCommissionInput): Promise<void> {
  await affiliateRepo.approveCommission(input.commissionId, input.approvedBy);
}

// Reject Commission
export interface RejectCommissionInput {
  commissionId: string;
  reason: string;
}

export async function rejectCommission(input: RejectCommissionInput): Promise<void> {
  if (!input.reason?.trim()) {
    throw new Error('Rejection reason is required');
  }

  await affiliateRepo.rejectCommission(input.commissionId, input.reason);
}
