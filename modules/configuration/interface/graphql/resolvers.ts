import SystemConfigRepo from '../../infrastructure/repositories/SystemConfigurationRepo';
import { requireBusinessAuth, requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetConfigurationUseCase, GetConfigurationInput } from '../../application/useCases/GetConfiguration';
import { GetFeatureFlagsUseCase, GetFeatureFlagsInput } from '../../application/useCases/GetFeatureFlags';
import { ToggleFeatureFlagUseCase, ToggleFeatureFlagInput } from '../../application/useCases/ToggleFeatureFlag';

export const configurationResolvers = {
  Query: {
    configuration: async (_parent: unknown, args: { input: GetConfigurationInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetConfigurationUseCase(SystemConfigRepo as never);
      return useCase.execute(args.input);
    },

    featureFlags: async (_parent: unknown, args: { input: GetFeatureFlagsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetFeatureFlagsUseCase(SystemConfigRepo as never);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    toggleFeatureFlag: async (_parent: unknown, args: { input: ToggleFeatureFlagInput }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new ToggleFeatureFlagUseCase(SystemConfigRepo as never);
      return useCase.execute(args.input);
    },
  },
};
