import LoyaltyRepo from '../../infrastructure/repositories/loyaltyRepo';
import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CheckPointsBalanceUseCase, CheckPointsBalanceInput } from '../../application/useCases/CheckPointsBalance';
import { EarnPointsUseCase, EarnPointsInput } from '../../application/useCases/EarnPoints';
import { RedeemPointsUseCase, RedeemPointsInput } from '../../application/useCases/RedeemPoints';
import { GetPointsHistoryUseCase, GetPointsHistoryInput } from '../../application/useCases/GetPointsHistory';
import { CalculateTierStatusUseCase, CalculateTierStatusInput } from '../../application/useCases/CalculateTierStatus';
import { CreateRewardUseCase, CreateRewardInput } from '../../application/useCases/CreateReward';
import { RedeemRewardUseCase, RedeemRewardInput } from '../../application/useCases/RedeemReward';

export const loyaltyResolvers = {
  Query: {
    pointsBalance: async (_parent: unknown, args: { customerId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CheckPointsBalanceUseCase(LoyaltyRepo as never);
      const input: CheckPointsBalanceInput = { customerId: args.customerId };
      return useCase.execute(input);
    },

    pointsHistory: async (_parent: unknown, args: {
      customerId: string;
      page?: number;
      limit?: number;
      type?: 'earned' | 'redeemed' | 'expired' | 'adjusted';
      startDate?: string;
      endDate?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new GetPointsHistoryUseCase(LoyaltyRepo as never);
      const input: GetPointsHistoryInput = {
        customerId: args.customerId,
        page: args.page,
        limit: args.limit,
        type: args.type,
        startDate: args.startDate ? new Date(args.startDate) : undefined,
        endDate: args.endDate ? new Date(args.endDate) : undefined,
      };
      return useCase.execute(input);
    },

    tierStatus: async (_parent: unknown, args: {
      customerId: string;
      programId?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CalculateTierStatusUseCase(LoyaltyRepo as never);
      const input: CalculateTierStatusInput = {
        customerId: args.customerId,
        programId: args.programId,
      };
      return useCase.execute(input);
    },
  },

  Mutation: {
    earnPoints: async (_parent: unknown, args: { input: EarnPointsInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new EarnPointsUseCase(LoyaltyRepo as never, LoyaltyRepo as never);
      return useCase.execute(args.input);
    },

    redeemPoints: async (_parent: unknown, args: { input: RedeemPointsInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RedeemPointsUseCase(LoyaltyRepo as never, LoyaltyRepo as never);
      return useCase.execute(args.input);
    },

    createReward: async (_parent: unknown, args: { input: CreateRewardInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CreateRewardUseCase(LoyaltyRepo as never);
      return useCase.execute(args.input);
    },

    redeemReward: async (_parent: unknown, args: {
      customerId: string;
      rewardId: string;
      orderId?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RedeemRewardUseCase(LoyaltyRepo as never);
      const input: RedeemRewardInput = {
        customerId: args.customerId,
        rewardId: args.rewardId,
        orderId: args.orderId,
      };
      return useCase.execute(input);
    },
  },
};
