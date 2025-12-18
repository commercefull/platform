/**
 * Apply for Affiliate Program Use Case
 */

import * as affiliateRepo from '../../../repos/affiliateRepo';

export interface ApplyForAffiliateInput {
  customerId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  socialMedia?: string;
  bio?: string;
  categories?: string[];
}

export interface ApplyForAffiliateOutput {
  affiliate: affiliateRepo.Affiliate;
  message: string;
}

export async function applyForAffiliate(input: ApplyForAffiliateInput): Promise<ApplyForAffiliateOutput> {
  // Validate email
  if (!input.email?.trim()) {
    throw new Error('Email is required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error('Invalid email address');
  }

  // Check if already an affiliate
  const existing = await affiliateRepo.getAffiliateByEmail(input.email);
  if (existing) {
    throw new Error('An affiliate account with this email already exists');
  }

  // Create affiliate application
  const affiliate = await affiliateRepo.saveAffiliate({
    customerId: input.customerId,
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName,
    lastName: input.lastName,
    companyName: input.companyName,
    website: input.website,
    socialMedia: input.socialMedia,
    bio: input.bio,
    categories: input.categories
  });

  return {
    affiliate,
    message: 'Application submitted successfully. We will review and get back to you.'
  };
}
