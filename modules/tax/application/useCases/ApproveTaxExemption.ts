/**
 * Approve Tax Exemption Use Case
 *
 * Approves a pending tax exemption, transitioning its status to 'approved'
 * and recording the verifier. Only approved exemptions are evaluated by
 * `CalculateOrderTax` (per Epic B).
 */

import { taxCommandRepo } from '../wired';
import type { CustomerTaxExemption } from '../../taxTypes';

export class ApproveTaxExemptionUseCase {
  async execute(exemptionId: string, verifiedBy: string): Promise<CustomerTaxExemption> {
    return taxCommandRepo.updateTaxExemption(exemptionId, {
      status: 'approved',
      isVerified: true,
      verifiedBy,
      verifiedAt: Date.now(),
    });
  }
}

export const approveTaxExemptionUseCase = new ApproveTaxExemptionUseCase();
