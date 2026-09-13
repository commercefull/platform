/**
 * Reject Tax Exemption Use Case
 *
 * Rejects a pending tax exemption, transitioning its status to 'rejected'.
 * Rejected exemptions are not evaluated by `CalculateOrderTax`.
 */

import { taxCommandRepo } from '../wired';
import type { CustomerTaxExemption } from '../../taxTypes';

export class RejectTaxExemptionUseCase {
  async execute(exemptionId: string, reason?: string): Promise<CustomerTaxExemption> {
    return taxCommandRepo.updateTaxExemption(exemptionId, {
      status: 'rejected',
      notes: reason,
    });
  }
}

export const rejectTaxExemptionUseCase = new RejectTaxExemptionUseCase();
