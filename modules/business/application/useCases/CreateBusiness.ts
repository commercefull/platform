/**
 * Create Business Use Case
 * Creates a new business for multi-store scenarios
 */

import { BusinessRepository } from '../../domain/repositories/BusinessRepository';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';
import { Business } from '../../domain/entities/Business';

// ============================================================================
// Command
// ============================================================================

export class CreateBusinessCommand {
  constructor(
    public readonly businessData: {
      name: string;
      slug?: string;
      description?: string;
      businessType: 'marketplace' | 'multi_store' | 'single_store';
      domain?: string;
      logo?: string;
      favicon?: string;
      primaryColor?: string;
      secondaryColor?: string;
      theme?: string;
      isActive?: boolean;
      settings?: any;
      metadata?: any;
    },
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateBusinessResponse {
  businessId: string;
  name: string;
  slug: string;
  businessType: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateBusinessUseCase {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly systemConfigRepository: SystemConfigurationRepository,
  ) {}

  async execute(command: CreateBusinessCommand): Promise<CreateBusinessResponse> {
    // Validate business creation against system configuration
    const systemConfig = await this.systemConfigRepository.findActive();

    if (!systemConfig) {
      throw new Error('System configuration not found. Cannot create business.');
    }

    // Check if business creation is allowed based on system mode
    if (systemConfig.systemMode === 'single_store' && (await this.businessRepository.count()) > 0) {
      throw new Error('Single store mode only allows one business. Business creation is not permitted.');
    }

    // Check business limits
    const currentBusinessCount = await this.businessRepository.count();
    const maxBusinesses = systemConfig.businessSettings?.maxMerchantsInMarketplace || systemConfig.businessSettings?.maxStoresPerBusiness;

    if (maxBusinesses && currentBusinessCount >= maxBusinesses) {
      throw new Error(`Maximum number of businesses (${maxBusinesses}) reached.`);
    }

    // Generate slug if not provided
    const slug = command.businessData.slug || this.generateSlug(command.businessData.name);

    // Check if slug is unique
    const existingBusiness = await this.businessRepository.findBySlug(slug);
    if (existingBusiness) {
      throw new Error(`Business with slug '${slug}' already exists.`);
    }

    // Check if domain is unique (if provided)
    if (command.businessData.domain) {
      const existingDomainBusiness = await this.businessRepository.findByDomain(command.businessData.domain);
      if (existingDomainBusiness) {
        throw new Error(`Business with domain '${command.businessData.domain}' already exists.`);
      }
    }

    // Create business entity
    const business = Business.create({
      businessId: this.generateBusinessId(),
      name: command.businessData.name,
      businessType: command.businessData.businessType,
      description: command.businessData.description,
      domain: command.businessData.domain,
      logo: command.businessData.logo,
      favicon: command.businessData.favicon,
      primaryColor: command.businessData.primaryColor,
      secondaryColor: command.businessData.secondaryColor,
      defaultCurrency: command.businessData.settings?.defaultCurrency,
      defaultLanguage: command.businessData.settings?.defaultLanguage,
      timezone: command.businessData.settings?.timezone,
      metadata: command.businessData.metadata,
    });

    // Save business
    const savedBusiness = await this.businessRepository.save(business);

    return {
      businessId: savedBusiness.businessId,
      name: savedBusiness.name,
      slug: savedBusiness.slug,
      businessType: savedBusiness.businessType,
      domain: savedBusiness.domain,
      isActive: savedBusiness.isActive,
      createdAt: savedBusiness.createdAt.toISOString(),
    };
  }

  private generateBusinessId(): string {
    return `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
