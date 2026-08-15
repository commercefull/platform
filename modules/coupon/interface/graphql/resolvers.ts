import CouponRepo from '../../infrastructure/repositories/CouponRepository';
import { requireBusinessAuth, requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { ValidateCouponUseCase, ValidateCouponCommand } from '../../application/useCases/ValidateCoupon';
import { ApplyCouponUseCase, ApplyCouponInput } from '../../application/useCases/ApplyCoupon';
import { RedeemCouponUseCase, RedeemCouponInput } from '../../application/useCases/RedeemCoupon';
import { CreateCouponUseCase, CreateCouponCommand } from '../../application/useCases/CreateCoupon';

export const couponResolvers = {
  Query: {
    validateCoupon: async (_parent: unknown, args: {
      code: string;
      orderValue: number;
      customerId?: string;
    }) => {
      const useCase = new ValidateCouponUseCase(CouponRepo);
      const command = new ValidateCouponCommand(args.code, args.orderValue, args.customerId);
      return useCase.execute(command);
    },
  },

  Mutation: {
    createCoupon: async (_parent: unknown, args: {
      input: {
        code: string; name: string; type: string; value: number; createdBy: string;
        description?: string; currency?: string; minOrderValue?: number;
        maxDiscountAmount?: number; usageType?: string; usageLimit?: number;
        customerUsageLimit?: number; startsAt?: string; expiresAt?: string;
        applicableProducts?: string[]; applicableCategories?: string[];
      };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateCouponUseCase(CouponRepo);
      const i = args.input;
      const command = new CreateCouponCommand(
        i.code, i.name, i.type as 'percentage' | 'fixed_amount' | 'free_shipping',
        i.value, i.createdBy, i.description, i.currency, i.minOrderValue,
        i.maxDiscountAmount, i.usageType as 'single_use' | 'multi_use' | 'unlimited',
        i.usageLimit, i.customerUsageLimit,
        i.startsAt ? new Date(i.startsAt) : undefined,
        i.expiresAt ? new Date(i.expiresAt) : undefined,
        i.applicableProducts, i.applicableCategories,
      );
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
      const useCase = new ApplyCouponUseCase(CouponRepo);
      return useCase.execute(args.input);
    },

    redeemCoupon: async (_parent: unknown, args: { input: RedeemCouponInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RedeemCouponUseCase(CouponRepo);
      return useCase.execute(args.input);
    },
  },
};
