/**
 * Manage Affiliate Links Use Cases
 */

import * as affiliateRepo from '../../../repos/affiliateRepo';

// Create Affiliate Link
export interface CreateAffiliateLinkInput {
  affiliateId: string;
  name?: string;
  destinationUrl: string;
  productId?: string;
  productCategoryId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface CreateAffiliateLinkOutput {
  link: affiliateRepo.AffiliateLink;
}

export async function createAffiliateLink(input: CreateAffiliateLinkInput): Promise<CreateAffiliateLinkOutput> {
  // Validate affiliate exists and is active
  const affiliate = await affiliateRepo.getAffiliate(input.affiliateId);
  if (!affiliate) {
    throw new Error('Affiliate not found');
  }

  if (affiliate.status !== 'active') {
    throw new Error('Only active affiliates can create links');
  }

  if (!input.destinationUrl?.trim()) {
    throw new Error('Destination URL is required');
  }

  // Validate URL format
  try {
    new URL(input.destinationUrl);
  } catch {
    throw new Error('Invalid destination URL');
  }

  const link = await affiliateRepo.saveAffiliateLink({
    affiliateId: input.affiliateId,
    name: input.name,
    destinationUrl: input.destinationUrl,
    productId: input.productId,
    productCategoryId: input.productCategoryId,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign
  });

  return { link };
}

// List Affiliate Links
export interface ListAffiliateLinksInput {
  affiliateId: string;
}

export interface ListAffiliateLinksOutput {
  links: affiliateRepo.AffiliateLink[];
}

export async function listAffiliateLinks(input: ListAffiliateLinksInput): Promise<ListAffiliateLinksOutput> {
  const links = await affiliateRepo.getAffiliateLinks(input.affiliateId);
  return { links };
}

// Track Link Click
export interface TrackLinkClickInput {
  shortCode: string;
  isUnique?: boolean;
}

export interface TrackLinkClickOutput {
  destinationUrl: string;
  affiliateId: string;
}

export async function trackLinkClick(input: TrackLinkClickInput): Promise<TrackLinkClickOutput> {
  const link = await affiliateRepo.getAffiliateLinkByCode(input.shortCode);
  
  if (!link) {
    throw new Error('Link not found');
  }

  if (!link.isActive) {
    throw new Error('Link is no longer active');
  }

  // Record the click
  await affiliateRepo.recordLinkClick(link.affiliateLinkId, input.isUnique ?? true);

  return {
    destinationUrl: link.destinationUrl,
    affiliateId: link.affiliateId
  };
}
