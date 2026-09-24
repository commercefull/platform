import { Vendor, VendorTier, VendorAddress, VendorBankInfo } from '../../domain/entities/Vendor';
import { VendorRepository } from '../../domain/repositories/MarketplaceRepository';
import { VendorNotFoundError, VendorAlreadyExistsError } from '../../domain/errors/MarketplaceErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

export class ManageVendorUseCase {
  constructor(private vendorRepo: VendorRepository) {}

  async create(input: {
    organizationId: string;
    name: string;
    email: string;
    legalName?: string;
    taxId?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    commissionRate?: number;
    tier?: VendorTier;
    address?: VendorAddress;
    bankInfo?: VendorBankInfo;
  }): Promise<Vendor> {
    const existing = await this.vendorRepo.findByEmail(input.email, input.organizationId);
    if (existing) throw new VendorAlreadyExistsError(input.name);

    const vendor = Vendor.create(input);
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.registered', {
      vendorId: vendor.vendorId,
      organizationId: vendor.organizationId,
      name: vendor.name,
    });
    logger.info('Vendor created', { vendorId: vendor.vendorId, name: vendor.name });
    return vendor;
  }

  async get(vendorId: string): Promise<Vendor> {
    const vendor = await this.vendorRepo.findById(vendorId);
    if (!vendor) throw new VendorNotFoundError(vendorId);
    return vendor;
  }

  async listByOrganization(organizationId: string): Promise<Vendor[]> {
    return this.vendorRepo.findByOrganizationId(organizationId);
  }

  async listByStatus(status: string, organizationId: string): Promise<Vendor[]> {
    return this.vendorRepo.findByStatus(status, organizationId);
  }

  async updateProfile(
    vendorId: string,
    updates: {
      name?: string;
      legalName?: string;
      taxId?: string;
      email?: string;
      phone?: string;
      website?: string;
      logoUrl?: string;
      description?: string;
    },
  ): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.updateProfile(updates);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setAddress(vendorId: string, address: VendorAddress): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setAddress(address);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setBankInfo(vendorId: string, bankInfo: VendorBankInfo): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setBankInfo(bankInfo);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async approve(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.approve();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.approved', { vendorId: vendor.vendorId });
    return vendor;
  }

  async suspend(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.suspend();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.suspended', { vendorId: vendor.vendorId });
    return vendor;
  }

  async terminate(vendorId: string): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.terminate();
    await this.vendorRepo.save(vendor);
    await eventBus.emit('marketplace.vendor.terminated', { vendorId: vendor.vendorId });
    return vendor;
  }

  async setTier(vendorId: string, tier: VendorTier): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setTier(tier);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async setCommissionRate(vendorId: string, rate: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.setCommissionRate(rate);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async recordOrder(vendorId: string, revenue: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.recordOrder(revenue);
    await this.vendorRepo.save(vendor);
    return vendor;
  }

  async updateRating(vendorId: string, rating: number): Promise<Vendor> {
    const vendor = await this.get(vendorId);
    vendor.updateRating(rating);
    await this.vendorRepo.save(vendor);
    return vendor;
  }
}

// ─── Commission Rule Use Cases ───

