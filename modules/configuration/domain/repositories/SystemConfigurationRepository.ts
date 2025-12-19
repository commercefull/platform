/**
 * System Configuration Repository Interface
 * Defines the contract for system configuration persistence operations
 */

import { SystemConfiguration } from '../entities/SystemConfiguration';

export interface SystemConfigurationRepository {
  // Configuration CRUD
  findById(configId: string): Promise<SystemConfiguration | null>;
  findActive(): Promise<SystemConfiguration | null>;
  save(config: SystemConfiguration): Promise<SystemConfiguration>;
  delete(configId: string): Promise<void>;

  // Configuration queries
  findAll(): Promise<SystemConfiguration[]>;
  count(): Promise<number>;
}
