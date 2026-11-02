/**
 * ConfigureStorePickup Use Case
 *
 * Configures BOPIS (Buy Online, Pick Up In Store) for a store.
 */

import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreNotFoundError } from '../../domain/errors/StoreErrors';

export interface ConfigureStorePickupInput {
  storeId: string;
  enabled: boolean;
  settings?: {
    prepareTimeMinutes?: number;
    maxHoldDays?: number;
    notifyOnReady?: boolean;
    notifyMethods?: ('email' | 'sms' | 'push')[];
    pickupInstructions?: string;
    requireIdVerification?: boolean;
    allowCurbside?: boolean;
    operatingHours?: Record<string, { open: string; close: string }>;
  };
}

export interface ConfigureStorePickupOutput {
  storeId: string;
  pickupEnabled: boolean;
  prepareTimeMinutes: number;
  maxHoldDays: number;
  updatedAt: string;
}

const DEFAULT_OPERATING_HOURS: Record<string, { open: string; close: string }> = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: { open: 'closed', close: 'closed' },
};

interface PickupSettings {
  [key: string]: unknown;
  enabled: boolean;
  prepareTimeMinutes: number;
  maxHoldDays: number;
  notifyOnReady: boolean;
  notifyMethods: ('email' | 'sms' | 'push')[];
  pickupInstructions: string;
  requireIdVerification: boolean;
  allowCurbside: boolean;
  operatingHours: Record<string, { open: string; close: string }>;
}

function nvl<T>(value: T | undefined | null, defaultValue: T): T {
  return value ?? defaultValue;
}

function buildPickupSettings(input: ConfigureStorePickupInput): PickupSettings {
  const s = input.settings;
  return {
    enabled: input.enabled,
    prepareTimeMinutes: nvl(s?.prepareTimeMinutes, 60),
    maxHoldDays: nvl(s?.maxHoldDays, 7),
    notifyOnReady: nvl(s?.notifyOnReady, true),
    notifyMethods: nvl(s?.notifyMethods, ['email']),
    pickupInstructions: nvl(s?.pickupInstructions, ''),
    requireIdVerification: nvl(s?.requireIdVerification, false),
    allowCurbside: nvl(s?.allowCurbside, false),
    operatingHours: nvl(s?.operatingHours, DEFAULT_OPERATING_HOURS),
  };
}

export class ConfigureStorePickupUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: ConfigureStorePickupInput): Promise<ConfigureStorePickupOutput> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new StoreNotFoundError(input.storeId);
    }

    const pickupSettings = buildPickupSettings(input);

    const updatedStore = await this.storeRepository.updatePickupSettings(input.storeId, pickupSettings);

    return {
      storeId: updatedStore.storeId,
      pickupEnabled: pickupSettings.enabled,
      prepareTimeMinutes: pickupSettings.prepareTimeMinutes,
      maxHoldDays: pickupSettings.maxHoldDays,
      updatedAt: updatedStore.updatedAt.toISOString(),
    };
  }
}
