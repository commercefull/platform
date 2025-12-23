/**
 * GetConfiguration Use Case
 */

export type ConfigurationScope = 'global' | 'store' | 'merchant' | 'channel';

export interface GetConfigurationInput {
  key: string;
  scope?: ConfigurationScope;
  scopeId?: string;
}

export interface ConfigurationValue {
  key: string;
  value: unknown;
  scope: ConfigurationScope;
  scopeId?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface GetConfigurationOutput {
  found: boolean;
  configuration?: ConfigurationValue;
  inheritedFrom?: ConfigurationScope;
}

export class GetConfigurationUseCase {
  constructor(private readonly configurationRepository: any) {}

  async execute(input: GetConfigurationInput): Promise<GetConfigurationOutput> {
    const scope = input.scope || 'global';

    // Try to get configuration at requested scope
    let config = await this.configurationRepository.findByKey(input.key, scope, input.scopeId);

    if (config) {
      return {
        found: true,
        configuration: {
          key: config.key,
          value: config.value,
          scope: config.scope,
          scopeId: config.scopeId,
          lastUpdated: config.updatedAt?.toISOString(),
          updatedBy: config.updatedBy,
        },
      };
    }

    // If not found and not global, check parent scopes
    if (scope !== 'global') {
      const globalConfig = await this.configurationRepository.findByKey(input.key, 'global');
      if (globalConfig) {
        return {
          found: true,
          configuration: {
            key: globalConfig.key,
            value: globalConfig.value,
            scope: 'global',
            lastUpdated: globalConfig.updatedAt?.toISOString(),
            updatedBy: globalConfig.updatedBy,
          },
          inheritedFrom: 'global',
        };
      }
    }

    return { found: false };
  }
}
