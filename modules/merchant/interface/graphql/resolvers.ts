import MerchantRepo from '../../infrastructure/repositories/merchantRepo';
import { requireBusinessAuth, requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateMerchantUseCase, CreateMerchantInput } from '../../application/useCases/CreateMerchant';
import { ApproveMerchantUseCase, ApproveMerchantInput } from '../../application/useCases/ApproveMerchant';
import { SuspendMerchantUseCase, SuspendMerchantInput } from '../../application/useCases/SuspendMerchant';
import { GetMerchantDashboardUseCase, GetMerchantDashboardInput } from '../../application/useCases/GetMerchantDashboard';

export const merchantResolvers = {
  Query: {
    merchantDashboard: async (_parent: unknown, args: { merchantId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetMerchantDashboardUseCase(MerchantRepo as unknown as import('../../application/useCases/GetMerchantDashboard').MerchantDashboardRepository);
      const input: GetMerchantDashboardInput = { merchantId: args.merchantId };
      return useCase.execute(input);
    },
  },

  Mutation: {
    createMerchant: async (_parent: unknown, args: { input: CreateMerchantInput }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new CreateMerchantUseCase(MerchantRepo);
      return useCase.execute(args.input);
    },

    approveMerchant: async (_parent: unknown, args: ApproveMerchantInput, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new ApproveMerchantUseCase(MerchantRepo);
      const input: ApproveMerchantInput = {
        merchantId: args.merchantId,
        approvedBy: args.approvedBy,
        notes: args.notes,
      };
      return useCase.execute(input);
    },

    suspendMerchant: async (_parent: unknown, args: SuspendMerchantInput, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new SuspendMerchantUseCase(MerchantRepo);
      const input: SuspendMerchantInput = {
        merchantId: args.merchantId,
        reason: args.reason,
        suspendedBy: args.suspendedBy,
      };
      return useCase.execute(input);
    },
  },
};
