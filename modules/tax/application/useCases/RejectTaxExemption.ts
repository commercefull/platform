/**
 * Reject Tax Exemption Use Case
 *
 * Rejects a pending tax exemption, transitioning its status to 'rejected'.
 * Rejected exemptions are not evaluated by `CalculateOrderTax`.
 */

import type { CustomerTaxExemption } from '../../taxTypes';

export interface TaxExemptionUpdatePort {
  updateTaxExemption(
    id: string,
    exemption: Partial<Omit<CustomerTaxExemption, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<CustomerTaxExemption>;
}

export class RejectTaxExemptionUseCase {
  constructor(private readonly commandRepo: TaxExemptionUpdatePort) {}

  async execute(exemptionId: string, reason?: string): Promise<CustomerTaxExemption> {
    return this.commandRepo.updateTaxExemption(exemptionId, {
      status: 'rejected',
      notes: reason,
    });
  }
}
