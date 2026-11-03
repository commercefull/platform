/**
 * LoyaltyBalanceAdapter
 *
 * ACL adapter implementing pricing's LoyaltyBalancePort.
 * Translates loyalty's points repository into pricing's flat
 * number vocabulary.
 *
 * Types against loyalty's public repository port.
 */

import { LoyaltyBalancePort } from '../../application/ports/LoyaltyBalancePort';
import type { LoyaltyPointsRepository } from '../../../loyalty';

export class LoyaltyBalanceAdapter implements LoyaltyBalancePort {
  constructor(private readonly loyaltyRepo: Pick<LoyaltyPointsRepository, 'findCustomerPoints'>) {}

  async getCustomerPoints(customerId: string): Promise<number> {
    const points = await this.loyaltyRepo.findCustomerPoints(customerId);
    return points?.currentPoints ?? 0;
  }
}
