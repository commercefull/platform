import { CreateOrganizationUseCase, CreateOrganizationInput } from '../../application/useCases/CreateOrganization';
import { GetOrganizationUseCase, GetOrganizationInput } from '../../application/useCases/GetOrganization';
import { ListOrganizationsUseCase, ListOrganizationsInput } from '../../application/useCases/ListOrganizations';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const organizationResolvers = {
  Query: {
    organization: async (_parent: unknown, args: { organizationId?: string; slug?: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetOrganizationUseCase();
      const input: GetOrganizationInput = { organizationId: args.organizationId, slug: args.slug };
      const result = await useCase.execute(input);
      return {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        settings: JSON.stringify(result.settings),
      };
    },

    organizations: async (_parent: unknown, args: ListOrganizationsInput, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListOrganizationsUseCase();
      const result = await useCase.execute(args);
      return {
        organizations: result.organizations.map(o => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.createdAt.toISOString(),
          settings: null,
        })),
        total: result.total,
      };
    },
  },

  Mutation: {
    createOrganization: async (_parent: unknown, args: { input: CreateOrganizationInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateOrganizationUseCase();
      return useCase.execute(args.input);
    },
  },
};
