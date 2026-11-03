import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CheckPointsBalanceInput } from '../../application/useCases/CheckPointsBalance';
import { RedeemPointsInput } from '../../application/useCases/RedeemPoints';
import { CreateRewardInput } from '../../application/useCases/CreateReward';
import { checkPointsBalanceUseCase, createRewardUseCase, redeemPointsUseCase } from '../../application/wired';

export const loyaltyResolvers = {
  Query: {
    pointsBalance: async (_parent: unknown, args: { customerId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const input: CheckPointsBalanceInput = { customerId: args.customerId };
      return checkPointsBalanceUseCase.execute(input);
    },
  },

  Mutation: {
    redeemPoints: async (_parent: unknown, args: { input: RedeemPointsInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return redeemPointsUseCase.execute(args.input);
    },

    createReward: async (_parent: unknown, args: { input: CreateRewardInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return createRewardUseCase.execute(args.input);
    },
  },
};
