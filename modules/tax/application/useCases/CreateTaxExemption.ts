/**
 * Create Tax Exemption Use Case
 *
 * Creates a new customer tax exemption with the new scope fields
 * (applicableTaxCategoryIds, minOrderAmount, maxOrderAmount, exemptionPercent).
 * New exemptions start in 'pending' status and must be approved via
 * `ApproveTaxExemption` before they take effect.
 */

import type { CustomerTaxExemption, TaxExemptionType } from '../../taxTypes';

export interface TaxExemptionCreatePort {
  createTaxExemption(exemption: Omit<CustomerTaxExemption, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerTaxExemption>;
}

export interface CreateTaxExemptionInput {
  customerId: string;
  type: TaxExemptionType;
  name: string;
  exemptionNumber: string;
  businessName?: string;
  exemptionReason?: string;
  documentUrl?: string;
  taxZoneId?: string;
  startDate?: number;
  expiryDate?: number;
  notes?: string;
  // Epic B scope fields
  applicableTaxCategoryIds?: string[] | null;
  minOrderAmount?: number | null;
  maxOrderAmount?: number | null;
  exemptionPercent?: number;
}

export class CreateTaxExemptionUseCase {
  constructor(private readonly commandRepo: TaxExemptionCreatePort) {}

  async execute(input: CreateTaxExemptionInput): Promise<CustomerTaxExemption> {
    return this.commandRepo.createTaxExemption({
      customerId: input.customerId,
      type: input.type,
      status: 'pending',
      name: input.name,
      exemptionNumber: input.exemptionNumber,
      businessName: input.businessName,
      exemptionReason: input.exemptionReason,
      documentUrl: input.documentUrl,
      taxZoneId: input.taxZoneId,
      startDate: input.startDate ?? Date.now(),
      expiryDate: input.expiryDate,
      isVerified: false,
      notes: input.notes,
      applicableTaxCategoryIds: input.applicableTaxCategoryIds ?? null,
      minOrderAmount: input.minOrderAmount ?? null,
      maxOrderAmount: input.maxOrderAmount ?? null,
      exemptionPercent: input.exemptionPercent ?? 100,
    });
  }
}
