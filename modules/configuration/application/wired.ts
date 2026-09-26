import SystemConfigRepo, { SystemConfigurationRepo } from '../infrastructure/repositories/SystemConfigurationRepo';
import { ManageSystemConfigurationUseCase } from './useCases/ManageSystemConfiguration';
import { UpdateSystemConfigurationUseCase } from './useCases/UpdateSystemConfiguration';
import { GetConfigurationUseCase } from './useCases/GetConfiguration';
import { GetFeatureFlagsUseCase } from './useCases/GetFeatureFlags';
import { ToggleFeatureFlagUseCase } from './useCases/ToggleFeatureFlag';

export { SystemConfigurationRepo, SystemConfigRepo };

export const manageSystemConfigurationUseCase = new ManageSystemConfigurationUseCase(SystemConfigRepo);
export const updateSystemConfigurationUseCase = new UpdateSystemConfigurationUseCase(SystemConfigRepo);
export const getConfigurationUseCase = new GetConfigurationUseCase(SystemConfigRepo as never);
export const getFeatureFlagsUseCase = new GetFeatureFlagsUseCase(SystemConfigRepo as never);
export const toggleFeatureFlagUseCase = new ToggleFeatureFlagUseCase(SystemConfigRepo as never);
