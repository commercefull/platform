/**
 * Checkout Configuration Repository Port
 *
 * Provides access to per-store checkout configurations.
 */

import { CheckoutConfig } from '../entities/CheckoutConfig';

export interface CheckoutConfigRepository {
  /** Find the default checkout config for a store */
  findDefaultByStore(storeId: string): Promise<CheckoutConfig | null>;

  /** Find a specific config by ID */
  findById(configId: string): Promise<CheckoutConfig | null>;

  /** Find all configs for a store */
  findAllByStore(storeId: string): Promise<CheckoutConfig[]>;

  /** Find all configs for an organization */
  findAllByOrganization(organizationId: string): Promise<CheckoutConfig[]>;

  /** Create a new checkout config */
  create(config: CheckoutConfig): Promise<CheckoutConfig>;

  /** Update an existing checkout config */
  update(configId: string, config: CheckoutConfig): Promise<CheckoutConfig | null>;

  /** Delete a checkout config */
  delete(configId: string): Promise<boolean>;

  /** Set a config as the default for its store (unsets previous default) */
  setDefault(configId: string): Promise<CheckoutConfig | null>;
}
