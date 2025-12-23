/**
 * AssignProductsToChannel Use Case
 * 
 * Assigns products to a distribution channel.
 */

import { IChannelRepository } from '../../domain/repositories/ChannelRepository';
import { ChannelProduct } from '../../domain/entities/ChannelProduct';
import { emitChannelProductsAssigned } from '../../domain/events/ChannelEvents';

export interface AssignProductsToChannelInput {
  channelId: string;
  productIds: string[];
  isVisible?: boolean;
  isFeatured?: boolean;
}

export interface AssignProductsToChannelOutput {
  channelProducts: ChannelProduct[];
  assignedCount: number;
}

export class AssignProductsToChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: AssignProductsToChannelInput): Promise<AssignProductsToChannelOutput> {
    // Verify channel exists
    const channel = await this.channelRepository.findById(input.channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${input.channelId}`);
    }

    // Bulk assign products
    const channelProducts = await this.channelRepository.bulkAssignProducts(
      input.channelId,
      input.productIds
    );

    // Emit event
    emitChannelProductsAssigned({
      channelId: input.channelId,
      productIds: input.productIds,
    });

    return {
      channelProducts,
      assignedCount: channelProducts.length,
    };
  }
}
