import { requireBusinessAuth, requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ListPromotionsCommand } from '../../application/useCases/ListPromotions';
import { CheckGiftCardBalanceQuery } from '../../application/useCases/CheckGiftCardBalance';
import { RedeemGiftCardCommand } from '../../application/useCases/RedeemGiftCard';
import { checkGiftCardBalanceUseCase, redeemGiftCardUseCase } from '../../application/wired';
import { listPromotionsUseCase } from '../../application/useCases/wired';

export const promotionResolvers = {
  Query: {
    promotions: async (
      _parent: unknown,
      args: {
        filters?: { status?: string; isActive?: boolean; organizationId?: string };
        pagination?: { limit?: number; offset?: number; orderBy?: string; direction?: 'ASC' | 'DESC' };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new ListPromotionsCommand(args.filters, args.pagination);
      return listPromotionsUseCase.execute(command);
    },

    giftCardBalance: async (_parent: unknown, args: { code: string }) => {
      const query = new CheckGiftCardBalanceQuery(args.code);
      return checkGiftCardBalanceUseCase.execute(query);
    },
  },

  Mutation: {
    redeemGiftCard: async (
      _parent: unknown,
      args: {
        code: string;
        amountCents: number;
        orderId?: string;
        customerId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const command = new RedeemGiftCardCommand(args.code, args.amountCents, args.orderId, args.customerId);
      return redeemGiftCardUseCase.execute(command);
    },
  },
};
