/**
 * UpdateChannel Use Case
 * 
 * Updates an existing distribution channel.
 */

import { Channel, FulfillmentStrategy } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/ChannelRepository';
import { emitChannelUpdated } from '../../domain/events/ChannelEvents';

export interface UpdateChannelInput {
  channelId: string;
  name?: string;
  catalogId?: string;
  priceListId?: string;
  currencyCode?: string;
  localeCode?: string;
  fulfillmentStrategy?: FulfillmentStrategy;
  requiresApproval?: boolean;
  allowCreditPayment?: boolean;
  b2bPricingEnabled?: boolean;
  commissionRate?: number;
  merchantVisible?: boolean;
  settings?: Record<string, unknown>;
}

export interface UpdateChannelOutput {
  channel: Channel;
}

export class UpdateChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: UpdateChannelInput): Promise<UpdateChannelOutput> {
    const channel = await this.channelRepository.findById(input.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${input.channelId}`);
    }

    // Build updates object
    const updates: Record<string, unknown> = {};
    
    if (input.name !== undefined) updates.name = input.name;
    if (input.catalogId !== undefined) updates.catalogId = input.catalogId;
    if (input.priceListId !== undefined) updates.priceListId = input.priceListId;
    if (input.currencyCode !== undefined) updates.currencyCode = input.currencyCode;
    if (input.localeCode !== undefined) updates.localeCode = input.localeCode;
    if (input.fulfillmentStrategy !== undefined) updates.fulfillmentStrategy = input.fulfillmentStrategy;
    if (input.requiresApproval !== undefined) updates.requiresApproval = input.requiresApproval;
    if (input.allowCreditPayment !== undefined) updates.allowCreditPayment = input.allowCreditPayment;
    if (input.b2bPricingEnabled !== undefined) updates.b2bPricingEnabled = input.b2bPricingEnabled;
    if (input.commissionRate !== undefined) updates.commissionRate = input.commissionRate;
    if (input.merchantVisible !== undefined) updates.merchantVisible = input.merchantVisible;
    if (input.settings !== undefined) updates.settings = input.settings;

    // Apply updates
    channel.update(updates);

    // Persist
    const savedChannel = await this.channelRepository.save(channel);

    // Emit event
    emitChannelUpdated({
      channelId: savedChannel.channelId,
      changes: updates,
    });

    return { channel: savedChannel };
  }
}
