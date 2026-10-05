import { storeDataRepository } from '../../../store/application/wired';
import type { StoreChannelPort } from '../../application/ports/StoreChannelPort';

export class StoreChannelAdapter implements StoreChannelPort {
  async isAssigned(storeId: string, salesChannelId: string): Promise<boolean> {
    const assignment = await storeDataRepository.salesChannels.findAssignment(storeId, salesChannelId);
    return Boolean(assignment?.isActive && assignment.channel?.status !== 'inactive');
  }
}
