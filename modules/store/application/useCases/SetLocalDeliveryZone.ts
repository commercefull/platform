/**
 * SetLocalDeliveryZone Use Case
 *
 * Configures local delivery zone for a store.
 */

import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

export interface SetLocalDeliveryZoneInput {
  storeId: string;
  enabled: boolean;
  radiusKm?: number;
  postalCodes?: string[];
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryMinutes?: number;
  maxDailyOrders?: number;
  availableSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
    maxOrders: number;
  }>;
}

export interface SetLocalDeliveryZoneOutput {
  storeId: string;
  localDeliveryEnabled: boolean;
  radiusKm?: number;
  postalCodeCount?: number;
  deliveryFee: number;
  updatedAt: string;
}

export class SetLocalDeliveryZoneUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: SetLocalDeliveryZoneInput): Promise<SetLocalDeliveryZoneOutput> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(input.storeId);
    }

    if (input.enabled && !input.radiusKm && !input.postalCodes?.length) {
      throw new StoreValidationError('Either radius or postal codes must be specified for local delivery');
    }

    const localDeliverySettings = {
      enabled: input.enabled,
      radiusKm: input.radiusKm,
      postalCodes: input.postalCodes || [],
      deliveryFee: input.deliveryFee ?? 0,
      freeDeliveryThreshold: input.freeDeliveryThreshold,
      estimatedDeliveryMinutes: input.estimatedDeliveryMinutes ?? 60,
      maxDailyOrders: input.maxDailyOrders ?? 50,
      availableSlots: input.availableSlots || [],
    };

    const updatedStore = await this.storeRepository.updateLocalDeliverySettings(input.storeId, localDeliverySettings);

    return {
      storeId: updatedStore.storeId,
      localDeliveryEnabled: localDeliverySettings.enabled,
      radiusKm: localDeliverySettings.radiusKm,
      postalCodeCount: localDeliverySettings.postalCodes.length,
      deliveryFee: localDeliverySettings.deliveryFee,
      updatedAt: updatedStore.updatedAt.toISOString(),
    };
  }
}
