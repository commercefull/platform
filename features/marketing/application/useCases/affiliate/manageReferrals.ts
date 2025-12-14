/**
 * Manage Referrals Use Cases
 */

import * as affiliateRepo from '../../../repos/affiliateRepo';

// Create Referral
export interface CreateReferralInput {
  referrerId: string;
  referralCode?: string;
  referredEmail?: string;
  referredFirstName?: string;
  source?: string;
  channel?: string;
  expiresAt?: Date;
}

export interface CreateReferralOutput {
  referral: affiliateRepo.Referral;
}

export async function createReferral(input: CreateReferralInput): Promise<CreateReferralOutput> {
  if (!input.referrerId) {
    throw new Error('Referrer ID is required');
  }

  // Generate referral code if not provided
  const referralCode = input.referralCode || `REF${input.referrerId.substring(0, 8).toUpperCase()}`;

  const referral = await affiliateRepo.createReferral({
    referrerId: input.referrerId,
    referralCode,
    referredEmail: input.referredEmail,
    referredFirstName: input.referredFirstName,
    source: input.source || 'manual',
    channel: input.channel,
    expiresAt: input.expiresAt
  });

  return { referral };
}

// List Referrals by Referrer
export interface ListReferralsInput {
  referrerId: string;
}

export interface ListReferralsOutput {
  referrals: affiliateRepo.Referral[];
}

export async function listReferralsByReferrer(input: ListReferralsInput): Promise<ListReferralsOutput> {
  const referrals = await affiliateRepo.getReferralsByReferrer(input.referrerId);
  return { referrals };
}

// Validate Referral Code
export interface ValidateReferralCodeInput {
  code: string;
}

export interface ValidateReferralCodeOutput {
  valid: boolean;
  referral?: affiliateRepo.Referral;
}

export async function validateReferralCode(input: ValidateReferralCodeInput): Promise<ValidateReferralCodeOutput> {
  const referral = await affiliateRepo.getReferralByCode(input.code);
  
  if (!referral) {
    return { valid: false };
  }

  // Check if expired
  if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
    return { valid: false };
  }

  // Check if already used
  if (referral.status !== 'pending') {
    return { valid: false };
  }

  return { valid: true, referral };
}

// Record Referral Signup
export interface RecordReferralSignupInput {
  referralCode: string;
  referredId: string;
}

export async function recordReferralSignup(input: RecordReferralSignupInput): Promise<void> {
  const referral = await affiliateRepo.getReferralByCode(input.referralCode);
  
  if (!referral) {
    throw new Error('Invalid referral code');
  }

  // TODO: Add recordReferralSignup to affiliateRepo
  // await affiliateRepo.recordReferralSignup(referral.referralId, input.referredId);
  console.log('Recording referral signup:', referral.referralId, input.referredId);
}

// Record Referral Purchase
export interface RecordReferralPurchaseInput {
  referralId: string;
  orderId: string;
  orderValue: number;
}

export async function recordReferralPurchase(input: RecordReferralPurchaseInput): Promise<void> {
  // TODO: Add recordReferralPurchase to affiliateRepo
  // await affiliateRepo.recordReferralPurchase(
  //   input.referralId,
  //   input.orderId,
  //   input.orderValue
  // );
  console.log('Recording referral purchase:', input.referralId, input.orderId, input.orderValue);
}
