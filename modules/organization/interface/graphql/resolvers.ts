import { requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateOrganizationUseCase, CreateOrganizationInput } from '../../application/useCases/CreateOrganization';
import { organizationRepoInstance as OrganizationRepo } from '../../application/wired';

export const organizationResolvers = {
  Query: {},

  Mutation: {
    createOrganization: async (_parent: unknown, args: { input: CreateOrganizationInput }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new CreateOrganizationUseCase(OrganizationRepo);
      return useCase.execute(args.input);
    },
  },
};
