/**
 * GetChannel Use Case
 *
 * Retrieves a channel by ID or code.
 */

import { Channel } from '../../domain/entities/Channel';
import { IChannelRepository } from '../../domain/repositories/ChannelRepository';

export interface GetChannelInput {
  channelId?: string;
  code?: string;
}

export interface GetChannelOutput {
  channel: Channel | null;
}

export class GetChannelUseCase {
  constructor(private channelRepository: IChannelRepository) {}

  async execute(input: GetChannelInput): Promise<GetChannelOutput> {
    if (!input.channelId && !input.code) {
      throw new Error('Either channelId or code must be provided');
    }

    let channel: Channel | null = null;

    if (input.channelId) {
      channel = await this.channelRepository.findById(input.channelId);
    } else if (input.code) {
      channel = await this.channelRepository.findByCode(input.code);
    }

    return { channel };
  }
}
