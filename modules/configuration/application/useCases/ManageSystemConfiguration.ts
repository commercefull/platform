import type { SystemConfiguration } from '../../domain/entities/SystemConfiguration';
import type { SystemConfigurationRepository } from '../../domain/repositories/SystemConfigurationRepository';

export class ManageSystemConfigurationUseCase {
  constructor(private readonly systemConfigRepository: SystemConfigurationRepository) {}

  async findById(configId: string) {
    return this.systemConfigRepository.findById(configId);
  }
  async findActive() {
    return this.systemConfigRepository.findActive();
  }
  async findAll() {
    return this.systemConfigRepository.findAll();
  }
  async count() {
    return this.systemConfigRepository.count();
  }
  async save(config: SystemConfiguration) {
    return this.systemConfigRepository.save(config);
  }
  async delete(configId: string) {
    return this.systemConfigRepository.delete(configId);
  }
}
