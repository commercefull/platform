/**
 * ListChannels Use Case
 *
 * Lists channels with optional filtering and pagination.
 */

import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository, ChannelFilters, PaginatedResult } from '../../domain/repositories/ChannelRepository';

export interface ListChannelsInput {
  type?: string;
  ownerType?: string;
  ownerId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ListChannelsOutput {
  channels: PaginatedResult<Channel>;
}

export class ListChannelsUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: ListChannelsInput): Promise<ListChannelsOutput> {
    const filters: ChannelFilters = {};
    if (input.type) filters.type = input.type;
    if (input.ownerType) filters.ownerType = input.ownerType;
    if (input.ownerId) filters.ownerId = input.ownerId;
    if (input.isActive !== undefined) filters.isActive = input.isActive;

    const pagination = {
      page: input.page || 1,
      limit: input.limit || 20,
    };

    const channels = await this.channelRepository.findAll(filters, pagination);

    return { channels };
  }
}
