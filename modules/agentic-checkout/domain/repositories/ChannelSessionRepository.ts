import type { ChannelSession } from '../entities/ChannelSession';

export interface ChannelSessionRepository {
  save(session: ChannelSession): Promise<ChannelSession>;
  findById(channelSessionId: string): Promise<ChannelSession | null>;
  findByCheckoutId(checkoutId: string): Promise<ChannelSession | null>;
  findByIntegration(integrationId: string, filters?: { status?: string; limit?: number; offset?: number }): Promise<ChannelSession[]>;
}
