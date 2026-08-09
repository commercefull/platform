import promotionRepo from '../../infrastructure/repositories/promotionRepo';
import { requireBusinessAuth, requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ListPromotionsUseCase, ListPromotionsCommand } from '../../application/useCases/ListPromotions';
import { ValidateCouponUseCase, ValidateCouponCommand } from '../../application/useCases/ValidateCoupon';
import { RedeemCouponUseCase, RedeemCouponCommand } from '../../application/useCases/RedeemCoupon';
import { CheckGiftCardBalanceUseCase, CheckGiftCardBalanceQuery } from '../../application/useCases/CheckGiftCardBalance';
import { RedeemGiftCardUseCase, RedeemGiftCardCommand } from '../../application/useCases/RedeemGiftCard';

export const promotionResolvers = {
  Query: {
    promotions: async (_parent: unknown, args: {
      filters?: { status?: string; isActive?: boolean; merchantId?: string };
      pagination?: { limit?: number; offset?: number; orderBy?: string; direction?: 'ASC' | 'DESC' };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListPromotionsUseCase(promotionRepo);
      const command = new ListPromotionsCommand(args.filters, args.pagination);
      return useCase.execute(command);
    },

    validateCoupon: async (_parent: unknown, args: {
      code: string;
      orderTotal: number;
      customerId?: string;
      merchantId?: string;
    }) => {
      const useCase = new ValidateCouponUseCase();
      const command = new ValidateCouponCommand(
        args.code, args.orderTotal, args.customerId, args.merchantId,
      );
      return useCase.execute(command);
    },

    giftCardBalance: async (_parent: unknown, args: { code: string }) => {
      const useCase = new CheckGiftCardBalanceUseCase();
      const query = new CheckGiftCardBalanceQuery(args.code);
      return useCase.execute(query);
    },
  },

  Mutation: {
    redeemCoupon: async (_parent: unknown, args: {
      code: string;
      orderId: string;
      orderTotal: number;
      discountAmount: number;
      customerId?: string;
      merchantId?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RedeemCouponUseCase();
      const command = new RedeemCouponCommand(
        args.code, args.orderId, args.orderTotal,
        args.discountAmount, args.customerId, args.merchantId,
      );
      return useCase.execute(command);
    },

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
