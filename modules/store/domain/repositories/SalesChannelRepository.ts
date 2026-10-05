import { SalesChannel, type StoreSalesChannel } from '../entities/SalesChannel';

export interface AssignSalesChannelInput {
  storeId: string;
  salesChannelId: string;
  isDefault?: boolean;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

export interface SalesChannelRepository {
  findById(salesChannelId: string): Promise<SalesChannel | null>;
  findByCode(organizationId: string, code: string): Promise<SalesChannel | null>;
  findByOrganization(organizationId: string): Promise<SalesChannel[]>;
  /** Platform-level listing for admin surfaces — not organization scoped. */
  findAll(): Promise<SalesChannel[]>;
  findByStore(storeId: string): Promise<StoreSalesChannel[]>;
  findAssignment(storeId: string, salesChannelId: string): Promise<StoreSalesChannel | null>;
  save(channel: SalesChannel): Promise<SalesChannel>;
  delete(salesChannelId: string): Promise<void>;
  assign(input: AssignSalesChannelInput): Promise<StoreSalesChannel>;
  unassign(storeId: string, salesChannelId: string): Promise<void>;
}
