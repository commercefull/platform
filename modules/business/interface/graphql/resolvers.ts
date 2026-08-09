import BusinessRepo from '../../infrastructure/repositories/BusinessRepo';
import { requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateBusinessUseCase, CreateBusinessCommand } from '../../application/useCases/CreateBusiness';

export const businessResolvers = {
  Mutation: {
    createBusiness: async (_parent: unknown, args: { input: Record<string, unknown> }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new CreateBusinessUseCase(BusinessRepo, BusinessRepo as never);
      const command = new CreateBusinessCommand(args.input as CreateBusinessCommand['businessData']);
      return useCase.execute(command);
    },
  },
};
