import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CheckPointsBalanceInput } from '../../application/useCases/CheckPointsBalance';
import { EarnPointsInput } from '../../application/useCases/EarnPoints';
import { RedeemPointsInput } from '../../application/useCases/RedeemPoints';
import { GetPointsHistoryInput } from '../../application/useCases/GetPointsHistory';
import { CalculateTierStatusInput } from '../../application/useCases/CalculateTierStatus';
import { CreateRewardInput } from '../../application/useCases/CreateReward';
import { RedeemRewardInput } from '../../application/useCases/RedeemReward';
import {
  calculateTierStatusUseCase,
  checkPointsBalanceUseCase,
  createRewardUseCase,
  earnPointsUseCase,
  getPointsHistoryUseCase,
  redeemPointsUseCase,
  redeemRewardUseCase,
} from '../../application/wired';

export const loyaltyResolvers = {
  Query: {
    pointsBalance: async (_parent: unknown, args: { customerId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const input: CheckPointsBalanceInput = { customerId: args.customerId };
      return checkPointsBalanceUseCase.execute(input);
    },

    pointsHistory: async (
      _parent: unknown,
      args: {
        customerId: string;
        page?: number;
        limit?: number;
        type?: 'earned' | 'redeemed' | 'expired' | 'adjusted';
        startDate?: string;
        endDate?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: GetPointsHistoryInput = {
        customerId: args.customerId,
        page: args.page,
        limit: args.limit,
        type: args.type,
        startDate: args.startDate ? new Date(args.startDate) : undefined,
        endDate: args.endDate ? new Date(args.endDate) : undefined,
      };
      return getPointsHistoryUseCase.execute(input);
    },

    tierStatus: async (
      _parent: unknown,
      args: {
        customerId: string;
        programId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: CalculateTierStatusInput = {
        customerId: args.customerId,
        programId: args.programId,
      };
      return calculateTierStatusUseCase.execute(input);
    },
  },

  Mutation: {
    earnPoints: async (_parent: unknown, args: { input: EarnPointsInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return earnPointsUseCase.execute(args.input);
    },

    redeemPoints: async (_parent: unknown, args: { input: RedeemPointsInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return redeemPointsUseCase.execute(args.input);
    },

    createReward: async (_parent: unknown, args: { input: CreateRewardInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return createRewardUseCase.execute(args.input);
    },

    redeemReward: async (
      _parent: unknown,
      args: {
        customerId: string;
        rewardId: string;
        orderId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: RedeemRewardInput = {
        customerId: args.customerId,
        rewardId: args.rewardId,
        orderId: args.orderId,
      };
      return redeemRewardUseCase.execute(input);
    },
  },
};
