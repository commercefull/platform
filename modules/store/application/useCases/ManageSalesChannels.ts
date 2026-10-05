import { generateUUID } from '../../../../libs/uuid';
import { SalesChannel, type SalesChannelStatus, type SalesChannelType } from '../../domain/entities/SalesChannel';
import type { SalesChannelRepository } from '../../domain/repositories/SalesChannelRepository';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

export interface CreateSalesChannelInput {
  organizationId: string;
  code: string;
  name: string;
  type: SalesChannelType;
  status?: SalesChannelStatus;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateSalesChannelInput {
  organizationId: string;
  salesChannelId: string;
  name?: string;
  type?: SalesChannelType;
  status?: SalesChannelStatus;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AssignSalesChannelToStoreInput {
  organizationId: string;
  storeId: string;
  salesChannelId: string;
  isDefault?: boolean;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

export class ManageSalesChannelsUseCase {
  constructor(
    private readonly salesChannelRepository: SalesChannelRepository,
    private readonly storeRepository: StoreRepository,
  ) {}

  async create(input: CreateSalesChannelInput): Promise<SalesChannel> {
    const channel = SalesChannel.create({ salesChannelId: generateUUID(), ...input });
    if (await this.salesChannelRepository.findByCode(input.organizationId, channel.code)) {
      throw new StoreValidationError(`Sales channel code '${channel.code}' already exists for this organization`);
    }
    return this.salesChannelRepository.save(channel);
  }

  async update(input: UpdateSalesChannelInput): Promise<SalesChannel> {
    const channel = await this.requireOwnedChannel(input.salesChannelId, input.organizationId);
    channel.update(input);
    return this.salesChannelRepository.save(channel);
  }

  async remove(organizationId: string, salesChannelId: string): Promise<void> {
    await this.requireOwnedChannel(salesChannelId, organizationId);
    await this.salesChannelRepository.delete(salesChannelId);
  }

  async listForOrganization(organizationId: string): Promise<SalesChannel[]> {
    return this.salesChannelRepository.findByOrganization(organizationId);
  }

  /** Platform-level listing for admin surfaces — not organization scoped. */
  async listAll(): Promise<SalesChannel[]> {
    return this.salesChannelRepository.findAll();
  }

  async listForStore(organizationId: string, storeId: string) {
    await this.requireOwnedStore(storeId, organizationId);
    return this.salesChannelRepository.findByStore(storeId);
  }

  async assignToStore(input: AssignSalesChannelToStoreInput) {
    await Promise.all([
      this.requireOwnedStore(input.storeId, input.organizationId),
      this.requireOwnedChannel(input.salesChannelId, input.organizationId),
    ]);
    if (await this.salesChannelRepository.findAssignment(input.storeId, input.salesChannelId)) {
      throw new StoreValidationError('Sales channel is already assigned to this store');
    }
    return this.salesChannelRepository.assign(input);
  }

  async unassignFromStore(organizationId: string, storeId: string, salesChannelId: string): Promise<void> {
    await Promise.all([this.requireOwnedStore(storeId, organizationId), this.requireOwnedChannel(salesChannelId, organizationId)]);
    await this.salesChannelRepository.unassign(storeId, salesChannelId);
  }

  /**
   * Validates that a storeId/channelId pair is usable on an entry point:
   * - the store exists, is active, and belongs to `organizationId` when given;
   * - the channel exists, is active, and belongs to `organizationId` when given;
   * - when both are provided, an active store-channel assignment must exist.
   *
   * Business callers always pass `organizationId`; customer-facing callers
   * omit it (org-agnostic existence/assignment checks only).
   */
  async assertStoreChannelAccess(input: { organizationId?: string; storeId?: string; channelId?: string }): Promise<void> {
    const { organizationId, storeId, channelId } = input;

    if (storeId) {
      const store = await this.storeRepository.findById(storeId);
      if (!store) throw new StoreNotFoundError(storeId);
      if (organizationId && store.organizationId !== organizationId) {
        throw new StoreValidationError('Store does not belong to this organization');
      }
      if (!store.isActive) throw new StoreValidationError('Store is not active');
    }

    if (channelId) {
      const channel = await this.salesChannelRepository.findById(channelId);
      if (!channel) throw new StoreValidationError(`Sales channel not found: ${channelId}`);
      if (organizationId && channel.organizationId !== organizationId) {
        throw new StoreValidationError('Sales channel does not belong to this organization');
      }
      if (channel.status !== 'active') throw new StoreValidationError('Sales channel is not active');
      if (storeId) {
        const assignment = await this.salesChannelRepository.findAssignment(storeId, channelId);
        if (!assignment || !assignment.isActive) {
          throw new StoreValidationError('Sales channel is not assigned to this store');
        }
      }
    }
  }

  private async requireOwnedStore(storeId: string, organizationId: string) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new StoreNotFoundError(storeId);
    if (store.organizationId !== organizationId) throw new StoreValidationError('Store does not belong to this organization');
    return store;
  }

  private async requireOwnedChannel(salesChannelId: string, organizationId: string): Promise<SalesChannel> {
    const channel = await this.salesChannelRepository.findById(salesChannelId);
    if (!channel) throw new StoreValidationError(`Sales channel not found: ${salesChannelId}`);
    if (channel.organizationId !== organizationId) throw new StoreValidationError('Sales channel does not belong to this organization');
    return channel;
  }
}
