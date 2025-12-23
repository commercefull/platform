/**
 * CreateChannel Use Case
 *
 * Creates a new distribution channel.
 */

import { Channel, ChannelType, OwnerType, FulfillmentStrategy } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/ChannelRepository';
import { emitChannelCreated } from '../../domain/events/ChannelEvents';

export interface CreateChannelInput {
  name: string;
  code: string;
  type: ChannelType;
  ownerType: OwnerType;
  ownerId?: string;
  storeIds?: string[];
  defaultStoreId?: string;
  catalogId?: string;
  priceListId?: string;
  currencyCode: string;
  localeCode: string;
  warehouseIds?: string[];
  fulfillmentStrategy?: FulfillmentStrategy;
  requiresApproval?: boolean;
  allowCreditPayment?: boolean;
  b2bPricingEnabled?: boolean;
  commissionRate?: number;
  merchantVisible?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  settings?: Record<string, unknown>;
}

export interface CreateChannelOutput {
  channel: Channel;
}

export class CreateChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: CreateChannelInput): Promise<CreateChannelOutput> {
    // Check if code already exists
    const existingChannel = await this.channelRepository.findByCode(input.code);
    if (existingChannel) {
      throw new Error(`Channel with code '${input.code}' already exists`);
    }

    // If setting as default, check current default
    if (input.isDefault) {
      const currentDefault = await this.channelRepository.findDefault();
      if (currentDefault) {
        currentDefault.removeDefault();
        await this.channelRepository.save(currentDefault);
      }
    }

    // Create the channel
    const channel = Channel.create({
      name: input.name,
      code: input.code,
      type: input.type,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      storeIds: input.storeIds || [],
      defaultStoreId: input.defaultStoreId,
      catalogId: input.catalogId,
      priceListId: input.priceListId,
      currencyCode: input.currencyCode,
      localeCode: input.localeCode,
      warehouseIds: input.warehouseIds || [],
      fulfillmentStrategy: input.fulfillmentStrategy || 'nearest',
      requiresApproval: input.requiresApproval,
      allowCreditPayment: input.allowCreditPayment,
      b2bPricingEnabled: input.b2bPricingEnabled,
      commissionRate: input.commissionRate,
      merchantVisible: input.merchantVisible,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
      settings: input.settings,
    });

    // Persist
    const savedChannel = await this.channelRepository.save(channel);

    // Emit event
    emitChannelCreated({
      channelId: savedChannel.channelId,
      name: savedChannel.name,
      code: savedChannel.code,
      type: savedChannel.type,
      ownerType: savedChannel.ownerType,
      ownerId: savedChannel.ownerId,
    });

    return { channel: savedChannel };
  }
}
