/**
 * AssignWarehouseToChannel Use Case
 * 
 * Assigns warehouses to a distribution channel for fulfillment.
 */

import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/ChannelRepository';
import { emitChannelWarehouseAssigned } from '../../domain/events/ChannelEvents';

export interface AssignWarehouseToChannelInput {
  channelId: string;
  warehouseIds: string[];
}

export interface AssignWarehouseToChannelOutput {
  channel: Channel;
}

export class AssignWarehouseToChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: AssignWarehouseToChannelInput): Promise<AssignWarehouseToChannelOutput> {
    const channel = await this.channelRepository.findById(input.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${input.channelId}`);
    }

    // Assign warehouses
    channel.assignWarehouses(input.warehouseIds);

    // Persist
    const savedChannel = await this.channelRepository.save(channel);

    // Emit event
    emitChannelWarehouseAssigned({
      channelId: savedChannel.channelId,
      warehouseIds: input.warehouseIds,
    });

    return { channel: savedChannel };
  }
}
