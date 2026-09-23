/**
 * Approve Tax Exemption Use Case
 *
 * Approves a pending tax exemption, transitioning its status to 'approved'
 * and recording the verifier. Only approved exemptions are evaluated by
 * `CalculateOrderTax` (per Epic B).
 */

import type { CustomerTaxExemption } from '../../taxTypes';

export interface TaxExemptionUpdatePort {
  updateTaxExemption(
    id: string,
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<CustomerTaxExemption>;
}

export class ApproveTaxExemptionUseCase {
  constructor(private readonly commandRepo: TaxExemptionUpdatePort) {}

  async execute(exemptionId: string, verifiedBy: string): Promise<CustomerTaxExemption> {
    return this.commandRepo.updateTaxExemption(exemptionId, {
      status: 'approved',
      isVerified: true,
      verifiedBy,
      verifiedAt: Date.now(),
    });
  }
}
