/**
 * Shared test utilities for configuration unit tests.
 *
 * Ports return plain records, so factories return typed mocks of each use
 * case's local port (extracted via ConstructorParameters where the port is
 * not exported) plus a real SystemConfiguration entity factory.
 */

import { SystemConfiguration } from '../domain/entities/SystemConfiguration';
import type { SystemConfigurationRepository } from '../domain/repositories/SystemConfigurationRepository';
import type { GetConfigurationUseCase } from '../application/useCases/GetConfiguration';
import type { GetFeatureFlagsUseCase } from '../application/useCases/GetFeatureFlags';
import type { ToggleFeatureFlagUseCase } from '../application/useCases/ToggleFeatureFlag';

type ConfigurationRepositoryPort = ConstructorParameters<typeof GetConfigurationUseCase>[0];
type FeatureFlagRepositoryPort = ConstructorParameters<typeof GetFeatureFlagsUseCase>[0];
type ToggleFeatureFlagRepositoryPort = ConstructorParameters<typeof ToggleFeatureFlagUseCase>[0];

type ConfigurationRecord = NonNullable<Awaited<ReturnType<ConfigurationRepositoryPort['findByKey']>>>;

export function createConfigurationRecord(overrides: Partial<ConfigurationRecord> = {}): ConfigurationRecord {
  return {
    key: 'site.name',
    value: 'MyStore',
    scope: 'global',
    updatedAt: new Date('2026-01-01'),
    updatedBy: 'admin',
    ...overrides,
  };
}

export function createConfigurationRepository(): jest.Mocked<ConfigurationRepositoryPort> {
  const repository: jest.Mocked<ConfigurationRepositoryPort> = {
    findByKey: jest.fn(),
  };
  repository.findByKey.mockResolvedValue(null);
  return repository;
}

export function createFeatureFlagRepository(): jest.Mocked<FeatureFlagRepositoryPort> {
  const repository: jest.Mocked<FeatureFlagRepositoryPort> = {
    findFeatureFlags: jest.fn(),
  };
  repository.findFeatureFlags.mockResolvedValue([]);
  return repository;
}

export function createToggleFlagRepository(): jest.Mocked<ToggleFeatureFlagRepositoryPort> {
  const repository: jest.Mocked<ToggleFeatureFlagRepositoryPort> = {
    findFeatureFlag: jest.fn(),
    upsertFeatureFlag: jest.fn(),
  };
  repository.findFeatureFlag.mockResolvedValue(null);
  repository.upsertFeatureFlag.mockImplementation(params =>
    Promise.resolve({ key: params.key, enabled: params.enabled, scope: params.scope, updatedAt: new Date('2026-01-01') }),
  );
  return repository;
}

export function createSystemConfiguration(overrides: Partial<Parameters<typeof SystemConfiguration.create>[0]> = {}): SystemConfiguration {
  return SystemConfiguration.create({
    configId: 'cfg-1',
    systemMode: 'multi_store',
    platformName: 'Test Platform',
    platformDomain: 'test.com',
    supportEmail: 'support@test.com',
    ...overrides,
  });
}

export function createSystemConfigurationRepository(
  config: SystemConfiguration | null = createSystemConfiguration(),
): jest.Mocked<SystemConfigurationRepository> {
  const repository: jest.Mocked<SystemConfigurationRepository> = {
    findById: jest.fn(),
    findActive: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };
  repository.findById.mockResolvedValue(config);
  repository.findActive.mockResolvedValue(config);
  repository.save.mockImplementation(c => Promise.resolve(c));
  repository.delete.mockResolvedValue(undefined);
  repository.findAll.mockResolvedValue(config ? [config] : []);
  repository.count.mockResolvedValue(config ? 1 : 0);
  return repository;
}
