/**
 * CreateTaxRate Use Case
 */

export interface CreateTaxRateInput {
  name: string;
  rate: number; // Percentage as decimal (e.g., 0.20 for 20%)
  type: 'percentage' | 'fixed';
  country: string;
  state?: string;
  postalCode?: string;
  city?: string;
  taxCategory?: string;
  isCompound?: boolean;
  includesShipping?: boolean;
  priority?: number;
  isActive?: boolean;
}

export interface CreateTaxRateOutput {
  taxRateId: string;
  name: string;
  rate: number;
  country: string;
  isActive: boolean;
  createdAt: string;
}

export class CreateTaxRateUseCase {
  constructor(private readonly taxRepository: any) {}

  async execute(input: CreateTaxRateInput): Promise<CreateTaxRateOutput> {
    if (!input.name || input.rate === undefined || !input.country) {
      throw new Error('Name, rate, and country are required');
    }

    if (input.rate < 0 || input.rate > 1) {
      throw new Error('Rate must be between 0 and 1 (e.g., 0.20 for 20%)');
    }

    const taxRateId = `txr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const taxRate = await this.taxRepository.createTaxRate({
      taxRateId,
      name: input.name,
      rate: input.rate,
      type: input.type || 'percentage',
      country: input.country,
      state: input.state,
      postalCode: input.postalCode,
      city: input.city,
      taxCategory: input.taxCategory,
      isCompound: input.isCompound ?? false,
      includesShipping: input.includesShipping ?? false,
      priority: input.priority || 0,
      isActive: input.isActive ?? true,
    });

    return {
      taxRateId: taxRate.taxRateId,
      name: taxRate.name,
      rate: taxRate.rate,
      country: taxRate.country,
      isActive: taxRate.isActive,
      createdAt: taxRate.createdAt.toISOString(),
    };
  }
}
