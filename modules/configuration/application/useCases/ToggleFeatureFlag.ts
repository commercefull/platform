/**
 * ToggleFeatureFlag Use Case
 */

export interface ToggleFeatureFlagInput {
  key: string;
  enabled: boolean;
  scope?: 'global' | 'store' | 'merchant';
  scopeId?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
  updatedBy: string;
}

export interface ToggleFeatureFlagOutput {
  key: string;
  enabled: boolean;
  scope: string;
  previousState: boolean;
  updatedAt: string;
}

export class ToggleFeatureFlagUseCase {
  constructor(private readonly configurationRepository: any) {}

  async execute(input: ToggleFeatureFlagInput): Promise<ToggleFeatureFlagOutput> {
    if (!input.key) {
      throw new Error('Feature flag key is required');
    }

    const scope = input.scope || 'global';

    const existingFlag = await this.configurationRepository.findFeatureFlag(input.key, scope, input.scopeId);

    const previousState = existingFlag?.enabled ?? false;

    const updatedFlag = await this.configurationRepository.upsertFeatureFlag({
      key: input.key,
      enabled: input.enabled,
      scope,
      scopeId: input.scopeId,
      rolloutPercentage: input.rolloutPercentage,
      conditions: input.conditions,
      updatedBy: input.updatedBy,
    });

    return {
      key: updatedFlag.key,
      enabled: updatedFlag.enabled,
      scope: updatedFlag.scope,
      previousState,
      updatedAt: updatedFlag.updatedAt.toISOString(),
    };
  }
}
