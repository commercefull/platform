import { requireBusinessAuth, requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetConfigurationInput } from '../../application/useCases/GetConfiguration';
import { GetFeatureFlagsInput } from '../../application/useCases/GetFeatureFlags';
import { ToggleFeatureFlagInput } from '../../application/useCases/ToggleFeatureFlag';
import {
  getConfigurationUseCase,
  getFeatureFlagsUseCase,
  toggleFeatureFlagUseCase,
} from '../../application/wired';

export const configurationResolvers = {
  Query: {
    configuration: async (_parent: unknown, args: { input: GetConfigurationInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return getConfigurationUseCase.execute(args.input);
    },

    featureFlags: async (_parent: unknown, args: { input: GetFeatureFlagsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return getFeatureFlagsUseCase.execute(args.input);
    },
  },

  Mutation: {
    toggleFeatureFlag: async (_parent: unknown, args: { input: ToggleFeatureFlagInput }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      return toggleFeatureFlagUseCase.execute(args.input);
    },
  },
};
