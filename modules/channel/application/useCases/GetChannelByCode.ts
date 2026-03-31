import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/ChannelRepository';

export interface ChannelByCodeResponse {
  channelId: string;
  name: string;
  code: string;
  type: string;
  ownerType: string;
  ownerId?: string;
  storeIds: string[];
  defaultStoreId?: string;
  isActive: boolean;
}

export class GetChannelByCodeUseCase {
  constructor(private readonly channelRepository: IChannelRepository) {}

  async execute(code: string): Promise<ChannelByCodeResponse | null> {
    if (!code) {
      throw new Error('Channel code is required');
    }

    const channel = await this.channelRepository.findByCode(code);
    if (!channel) {
      return null;
    }

    return this.mapToResponse(channel);
  }

  private mapToResponse(channel: Channel): ChannelByCodeResponse {
    return {
      channelId: channel.channelId,
      name: channel.name,
      code: channel.code,
      type: channel.type,
      ownerType: channel.ownerType,
      ownerId: channel.ownerId,
      storeIds: channel.storeIds,
      defaultStoreId: channel.defaultStoreId,
      isActive: channel.isActive,
    };
  }
}
