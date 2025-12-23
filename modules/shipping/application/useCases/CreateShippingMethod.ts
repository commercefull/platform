/**
 * CreateShippingMethod Use Case
 */

import { ShippingMethod, ShippingMethodType, CarrierType } from '../../domain/entities/ShippingMethod';
import { eventBus } from '../../../../libs/events/eventBus';

export interface CreateShippingMethodInput {
  name: string;
  code: string;
  description?: string;
  type: ShippingMethodType;
  carrierId?: string;
  carrierType?: CarrierType;
  carrierServiceCode?: string;
  basePrice: number;
  pricePerKg?: number;
  pricePerItem?: number;
  minPrice?: number;
  maxPrice?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  minWeight?: number;
  maxWeight?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  zoneIds?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  storeId?: string;
  merchantId?: string;
}

export interface CreateShippingMethodOutput {
  shippingMethod: ShippingMethod;
}

export class CreateShippingMethodUseCase {
  constructor(private readonly shippingRepository: any) {}

  async execute(input: CreateShippingMethodInput): Promise<CreateShippingMethodOutput> {
    // Check code uniqueness
    const existing = await this.shippingRepository.findMethodByCode(input.code);
    if (existing) {
      throw new Error(`Shipping method with code '${input.code}' already exists`);
    }

    const shippingMethod = ShippingMethod.create({
      name: input.name,
      code: input.code,
      description: input.description,
      type: input.type,
      carrierId: input.carrierId,
      carrierType: input.carrierType,
      carrierServiceCode: input.carrierServiceCode,
      basePrice: input.basePrice,
      pricePerKg: input.pricePerKg,
      pricePerItem: input.pricePerItem,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      minOrderValue: input.minOrderValue,
      maxOrderValue: input.maxOrderValue,
      minWeight: input.minWeight,
      maxWeight: input.maxWeight,
      estimatedDaysMin: input.estimatedDaysMin,
      estimatedDaysMax: input.estimatedDaysMax,
      zoneIds: input.zoneIds || [],
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
      sortOrder: 0,
      storeId: input.storeId,
      merchantId: input.merchantId,
    });

    const saved = await this.shippingRepository.saveMethod(shippingMethod);

    eventBus.emit('shipping.method_created', {
      shippingMethodId: saved.shippingMethodId,
      name: saved.name,
      type: saved.type,
    });

    return { shippingMethod: saved };
  }
}
