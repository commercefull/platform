/**
 * CreateShippingZone Use Case
 */

import { ShippingZone, ZoneLocation } from '../../domain/entities/ShippingZone';
import { eventBus } from '../../../../libs/events/eventBus';

export interface CreateShippingZoneInput {
  name: string;
  description?: string;
  locations: ZoneLocation[];
  isDefault?: boolean;
  isActive?: boolean;
  storeId?: string;
  merchantId?: string;
}

export interface CreateShippingZoneOutput {
  shippingZone: ShippingZone;
}

export class CreateShippingZoneUseCase {
  constructor(private readonly shippingRepository: any) {}

  async execute(input: CreateShippingZoneInput): Promise<CreateShippingZoneOutput> {
    const shippingZone = ShippingZone.create({
      name: input.name,
      description: input.description,
      locations: input.locations,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
      storeId: input.storeId,
      merchantId: input.merchantId,
    });

    const saved = await this.shippingRepository.saveZone(shippingZone);

    eventBus.emit('shipping.zone_created', {
      shippingZoneId: saved.shippingZoneId,
      name: saved.name,
      locationCount: saved.locations.length,
    });

    return { shippingZone: saved };
  }
}
