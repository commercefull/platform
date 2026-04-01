/**
 * CreateAffiliate Use Case
 *
 * Creates an affiliate record and generates a tracking link in marketingAffiliateLink.
 *
 * Validates: Requirements 6.7
 */

import * as affiliateRepo from '../../infrastructure/repositories/affiliateRepo';

// ============================================================================
// Command
// ============================================================================

export class CreateAffiliateCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly code: string,
    public readonly commissionRate: number,
    public readonly trackingUrl: string,
    public readonly trackingSlug: string,
    public readonly customerId?: string,
    public readonly merchantId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateAffiliateResponse {
  marketingAffiliateId: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number;
  status: string;
  trackingLink: {
    marketingAffiliateLinkId: string;
    url: string;
    slug: string;
  };
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateAffiliateUseCase {
  constructor(private readonly affRepo: typeof affiliateRepo = affiliateRepo) {}

  async execute(command: CreateAffiliateCommand): Promise<CreateAffiliateResponse> {
    if (!command.name) throw new Error('Affiliate name is required');
    if (!command.email) throw new Error('Affiliate email is required');
    if (!command.code) throw new Error('Affiliate code is required');
    if (command.commissionRate < 0 || command.commissionRate > 100) {
      throw new Error('Commission rate must be between 0 and 100');
    }

    // Ensure code is unique
    const existing = await this.affRepo.findByCode(command.code);
    if (existing) throw new Error(`Affiliate code '${command.code}' is already in use`);

    const affiliate = await this.affRepo.create({
      name: command.name,
      email: command.email,
      code: command.code,
      commissionRate: command.commissionRate,
      status: 'active',
      customerId: command.customerId,
      merchantId: command.merchantId,
    });

    if (!affiliate) throw new Error('Failed to create affiliate');

    const link = await this.affRepo.createLink(
      affiliate.marketingAffiliateId,
      command.trackingUrl,
      command.trackingSlug,
    );

    if (!link) throw new Error('Failed to create affiliate tracking link');

    return {
      marketingAffiliateId: affiliate.marketingAffiliateId,
      name: affiliate.name,
      email: affiliate.email,
      code: affiliate.code,
      commissionRate: affiliate.commissionRate,
      status: affiliate.status,
      trackingLink: {
        marketingAffiliateLinkId: link.marketingAffiliateLinkId,
        url: link.url,
        slug: link.slug,
      },
      createdAt: affiliate.createdAt.toISOString(),
    };
  }
}
