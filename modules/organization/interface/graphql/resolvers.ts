import { requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import type { CreateOrganizationInput } from '../../application/useCases/CreateOrganization';
import { createOrganizationUseCase } from '../../application/wired';

export const organizationResolvers = {
  Query: {},

  Mutation: {
    createOrganization: async (_parent: unknown, args: { input: CreateOrganizationInput }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      return createOrganizationUseCase.execute(args.input);
    },
  },
};
