import { requireBusinessAuth, requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ValidateCouponCommand } from '../../application/useCases/ValidateCoupon';
import { ApplyCouponInput } from '../../application/useCases/ApplyCoupon';
import { RedeemCouponInput } from '../../application/useCases/RedeemCoupon';
import { CreateCouponCommand } from '../../application/useCases/CreateCoupon';
import { validateCouponUseCase, createCouponUseCase, applyCouponUseCase, redeemCouponUseCase } from '../../application/wired';

export const couponResolvers = {
  Query: {
    validateCoupon: async (
      _parent: unknown,
      args: {
        code: string;
        orderValueCents: number;
        customerId?: string;
      },
    ) => {
      const command = new ValidateCouponCommand(args.code, args.orderValueCents, args.customerId);
      return validateCouponUseCase.execute(command);
    },
  },

  Mutation: {
    createCoupon: async (
      _parent: unknown,
      args: {
        input: {
          code: string;
          name: string;
          type: string;
          value: number;
          createdBy: string;
          description?: string;
          currency?: string;
          minOrderValueCents?: number;
          maxDiscountAmountCents?: number;
          usageType?: string;
          usageLimit?: number;
          customerUsageLimit?: number;
          startsAt?: string;
          expiresAt?: string;
          applicableProducts?: string[];
          applicableCategories?: string[];
        };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const useCase = createCouponUseCase;
      const i = args.input;
      const command = new CreateCouponCommand({
        code: i.code,
        name: i.name,
        type: i.type as 'percentage' | 'fixed_amount' | 'free_shipping',
        value: i.value,
        createdBy: i.createdBy,
        description: i.description,
        currency: i.currency,
        minOrderValueCents: i.minOrderValueCents,
        maxDiscountAmountCents: i.maxDiscountAmountCents,
        usageType: i.usageType as 'single_use' | 'multi_use' | 'unlimited',
        usageLimit: i.usageLimit,
        customerUsageLimit: i.customerUsageLimit,
        startsAt: i.startsAt ? new Date(i.startsAt) : undefined,
        expiresAt: i.expiresAt ? new Date(i.expiresAt) : undefined,
        applicableProducts: i.applicableProducts,
        applicableCategories: i.applicableCategories,
      });
      const coupon = await useCase.execute(command);
      return {
        couponId: coupon.couponId,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
      };
    },

    applyCouponCode: async (_parent: unknown, args: { input: ApplyCouponInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return applyCouponUseCase.execute(args.input);
    },

    redeemCoupon: async (_parent: unknown, args: { input: RedeemCouponInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return redeemCouponUseCase.execute(args.input);
    },
  },
};
