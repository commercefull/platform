/**
 * GetFeatureFlags Use Case
 */

export interface GetFeatureFlagsInput {
  scope?: 'global' | 'store' | 'merchant';
  scopeId?: string;
  includeDisabled?: boolean;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  scope: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
}

export interface GetFeatureFlagsOutput {
  flags: FeatureFlag[];
  total: number;
}

export class GetFeatureFlagsUseCase {
  constructor(private readonly configurationRepository: any) {}

  async execute(input: GetFeatureFlagsInput): Promise<GetFeatureFlagsOutput> {
    const scope = input.scope || 'global';

    const flags = await this.configurationRepository.findFeatureFlags({
      scope,
      scopeId: input.scopeId,
      includeDisabled: input.includeDisabled ?? false,
    });

    return {
      flags: flags.map((f: any) => ({
        key: f.key,
        name: f.name,
        description: f.description,
        enabled: f.enabled,
        scope: f.scope,
        rolloutPercentage: f.rolloutPercentage,
        conditions: f.conditions,
      })),
      total: flags.length,
    };
  }
}
