import promotionRepo from '../../infrastructure/repositories/promotionRepo';
import { requireBusinessAuth, requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ListPromotionsUseCase, ListPromotionsCommand } from '../../application/useCases/ListPromotions';
import { CheckGiftCardBalanceUseCase, CheckGiftCardBalanceQuery } from '../../application/useCases/CheckGiftCardBalance';
import { RedeemGiftCardUseCase, RedeemGiftCardCommand } from '../../application/useCases/RedeemGiftCard';

export const promotionResolvers = {
  Query: {
    promotions: async (_parent: unknown, args: {
      filters?: { status?: string; isActive?: boolean; organizationId?: string };
      pagination?: { limit?: number; offset?: number; orderBy?: string; direction?: 'ASC' | 'DESC' };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListPromotionsUseCase(promotionRepo);
      const command = new ListPromotionsCommand(args.filters, args.pagination);
      return useCase.execute(command);
    },

    giftCardBalance: async (_parent: unknown, args: { code: string }) => {
      const useCase = new CheckGiftCardBalanceUseCase();
      const query = new CheckGiftCardBalanceQuery(args.code);
      return useCase.execute(query);
    },
  },

  Mutation: {
    redeemGiftCard: async (_parent: unknown, args: {
      code: string;
      amount: number;
      orderId?: string;
      customerId?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RedeemGiftCardUseCase();
      const command = new RedeemGiftCardCommand(
        args.code, args.amount, args.orderId, args.customerId,
      );
      return useCase.execute(command);
    },
  },
};
