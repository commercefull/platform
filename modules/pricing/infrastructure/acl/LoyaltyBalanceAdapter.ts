/**
 * LoyaltyBalanceAdapter
 *
 * ACL adapter implementing pricing's LoyaltyBalancePort.
 * Translates loyalty's LoyaltyRepo into pricing's flat
 * number vocabulary.
 *
 * Only this adapter may import from loyalty's infrastructure.
 */

import { LoyaltyBalancePort } from '../../application/ports/LoyaltyBalancePort';
import { LoyaltyRepo } from '../../../loyalty/infrastructure/repositories/loyaltyRepo';

export class LoyaltyBalanceAdapter implements LoyaltyBalancePort {
  async getCustomerPoints(customerId: string): Promise<number> {
    const points = await new LoyaltyRepo().findCustomerPoints(customerId);
    return points?.currentPoints ?? 0;
  }
}
