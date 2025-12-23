import { AttributeGroup } from './attributeGroup';

export class Variant {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly price: number,
    private readonly priceDecimals: number,
    private readonly description: string,
    private readonly productId: string,
    private readonly imageUrl: string,
    private readonly variantAttributeGroups: AttributeGroup[],
    private readonly availability: boolean,
  ) {}
}
