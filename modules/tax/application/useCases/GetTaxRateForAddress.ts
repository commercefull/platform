/**
 * GetTaxRateForAddress Use Case
 */

export interface AddressInput {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

export interface GetTaxRateForAddressInput {
  address: AddressInput;
  taxCategory?: string;
  customerId?: string;
}

export interface TaxRateResult {
  taxRateId: string;
  name: string;
  rate: number;
  isCompound: boolean;
  includesShipping: boolean;
}

export interface GetTaxRateForAddressOutput {
  rates: TaxRateResult[];
  combinedRate: number;
  isExempt: boolean;
  exemptionReason?: string;
}

export class GetTaxRateForAddressUseCase {
  constructor(
    private readonly taxRepository: any,
    private readonly customerRepository: any,
  ) {}

  async execute(input: GetTaxRateForAddressInput): Promise<GetTaxRateForAddressOutput> {
    // Check for customer tax exemption
    if (input.customerId) {
      const exemption = await this.customerRepository.getTaxExemption(input.customerId);
      if (exemption?.isActive) {
        return {
          rates: [],
          combinedRate: 0,
          isExempt: true,
          exemptionReason: exemption.reason,
        };
      }
    }

    // Find applicable tax rates
    const rates = await this.taxRepository.findRatesForAddress({
      country: input.address.country,
      state: input.address.state,
      city: input.address.city,
      postalCode: input.address.postalCode,
      taxCategory: input.taxCategory,
    });

    if (!rates || rates.length === 0) {
      return {
        rates: [],
        combinedRate: 0,
        isExempt: false,
      };
    }

    // Calculate combined rate (considering compound taxes)
    let combinedRate = 0;
    const sortedRates = rates.sort((a: any, b: any) => a.priority - b.priority);

    for (const rate of sortedRates) {
      if (rate.isCompound) {
        // Compound tax is applied on top of previous taxes
        combinedRate = combinedRate + (1 + combinedRate) * rate.rate;
      } else {
        combinedRate += rate.rate;
      }
    }

    return {
      rates: sortedRates.map((r: any) => ({
        taxRateId: r.taxRateId,
        name: r.name,
        rate: r.rate,
        isCompound: r.isCompound,
        includesShipping: r.includesShipping,
      })),
      combinedRate,
      isExempt: false,
    };
  }
}
