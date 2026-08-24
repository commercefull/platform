import { Vendor } from '../entities/Vendor';
import { CommissionRule } from '../entities/CommissionRule';
import { VendorPayout } from '../entities/VendorPayout';

export interface VendorRepository {
  findById(vendorId: string): Promise<Vendor | null>;
  findByOrganizationId(organizationId: string): Promise<Vendor[]>;
  findByEmail(email: string, organizationId: string): Promise<Vendor | null>;
  findByStatus(status: string, organizationId: string): Promise<Vendor[]>;
  save(vendor: Vendor): Promise<void>;
  delete(vendorId: string): Promise<void>;
}

export interface CommissionRuleRepository {
  findById(ruleId: string): Promise<CommissionRule | null>;
  findByOrganizationId(organizationId: string): Promise<CommissionRule[]>;
  findActiveByOrganizationId(organizationId: string): Promise<CommissionRule[]>;
  findByVendorId(vendorId: string, organizationId: string): Promise<CommissionRule[]>;
  findByCategoryId(categoryId: string, organizationId: string): Promise<CommissionRule[]>;
  save(rule: CommissionRule): Promise<void>;
  delete(ruleId: string): Promise<void>;
}

export interface VendorPayoutRepository {
  findById(payoutId: string): Promise<VendorPayout | null>;
  findByPayoutNumber(payoutNumber: string): Promise<VendorPayout | null>;
  findByVendorId(vendorId: string): Promise<VendorPayout[]>;
  findByOrganizationId(organizationId: string): Promise<VendorPayout[]>;
  findByStatus(status: string, organizationId: string): Promise<VendorPayout[]>;
  findPendingByVendorId(vendorId: string): Promise<VendorPayout[]>;
  save(payout: VendorPayout): Promise<void>;
  delete(payoutId: string): Promise<void>;
}
