/**
 * CreatePriceList Use Case
 */

export interface CreatePriceListInput {
  name: string;
  description?: string;
  currencyCode: string;
  type: 'standard' | 'sale' | 'b2b' | 'volume' | 'promotional';
  isDefault?: boolean;
  validFrom?: Date;
  validTo?: Date;
  companyIds?: string[];
  customerSegmentIds?: string[];
  storeIds?: string[];
}

export interface CreatePriceListOutput {
  priceListId: string;
  name: string;
  type: string;
  currencyCode: string;
  isDefault: boolean;
  createdAt: string;
}

export class CreatePriceListUseCase {
  constructor(private readonly pricingRepository: any) {}

  async execute(input: CreatePriceListInput): Promise<CreatePriceListOutput> {
    if (!input.name || !input.currencyCode) {
      throw new Error('Name and currency code are required');
    }

    const priceListId = `pl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const priceList = await this.pricingRepository.createPriceList({
      priceListId,
      name: input.name,
      description: input.description,
      currencyCode: input.currencyCode,
      type: input.type,
      isDefault: input.isDefault ?? false,
      validFrom: input.validFrom,
      validTo: input.validTo,
      companyIds: input.companyIds || [],
      customerSegmentIds: input.customerSegmentIds || [],
      storeIds: input.storeIds || [],
      isActive: true,
    });

    return {
      priceListId: priceList.priceListId,
      name: priceList.name,
      type: priceList.type,
      currencyCode: priceList.currencyCode,
      isDefault: priceList.isDefault,
      createdAt: priceList.createdAt.toISOString(),
    };
  }
}
