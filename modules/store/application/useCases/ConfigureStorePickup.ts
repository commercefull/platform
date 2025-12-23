/**
 * ConfigureStorePickup Use Case
 * 
 * Configures BOPIS (Buy Online, Pick Up In Store) for a store.
 */

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

export class ConfigureStorePickupUseCase {
  constructor(private readonly storeRepository: any) {}

  async execute(input: ConfigureStorePickupInput): Promise<ConfigureStorePickupOutput> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error(`Store not found: ${input.storeId}`);
    }

    const pickupSettings = {
      enabled: input.enabled,
      prepareTimeMinutes: input.settings?.prepareTimeMinutes ?? 60,
      maxHoldDays: input.settings?.maxHoldDays ?? 7,
      notifyOnReady: input.settings?.notifyOnReady ?? true,
      notifyMethods: input.settings?.notifyMethods ?? ['email'],
      pickupInstructions: input.settings?.pickupInstructions ?? '',
      requireIdVerification: input.settings?.requireIdVerification ?? false,
      allowCurbside: input.settings?.allowCurbside ?? false,
      operatingHours: input.settings?.operatingHours ?? {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: 'closed', close: 'closed' },
      },
    };

    const updatedStore = await this.storeRepository.updatePickupSettings(
      input.storeId,
      pickupSettings
    );

    return {
      storeId: updatedStore.storeId,
      pickupEnabled: pickupSettings.enabled,
      prepareTimeMinutes: pickupSettings.prepareTimeMinutes,
      maxHoldDays: pickupSettings.maxHoldDays,
      updatedAt: updatedStore.updatedAt.toISOString(),
    };
  }
}
