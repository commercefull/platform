/**
 * SystemConfigAdapter
 *
 * ACL adapter implementing product's SystemConfigPort.
 * Translates configuration's SystemConfigurationRepository into
 * product's SystemConfigSummary vocabulary.
 *
 * Only this adapter may import from configuration's domain.
 */

import { SystemConfigPort, SystemConfigSummary } from '../../application/ports/SystemConfigPort';
import { SystemConfigurationRepository } from '../../../configuration/domain/repositories/SystemConfigurationRepository';

export class SystemConfigAdapter implements SystemConfigPort {
  constructor(private readonly systemConfigRepository: SystemConfigurationRepository) {}

  async findActive(): Promise<SystemConfigSummary | null> {
    const config = await this.systemConfigRepository.findActive();
    if (!config) return null;
    return {
      isMarketplace: config.isMarketplace,
      isMultiStore: config.isMultiStore,
      isSingleStore: config.isSingleStore,
    };
  }
}
