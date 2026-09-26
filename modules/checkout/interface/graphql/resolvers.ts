import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { InitiateCheckoutCommand, mapCheckoutToResponse } from '../../application/useCases/InitiateCheckout';
import { SetShippingAddressCommand } from '../../application/useCases/SetShippingAddress';
import { SetBillingAddressCommand } from '../../application/useCases/SetBillingAddress';
import { SetShippingMethodCommand } from '../../application/useCases/SetShippingMethod';
import { SetPaymentMethodCommand } from '../../application/useCases/SetPaymentMethod';
import { ApplyCouponCommand } from '../../application/useCases/ApplyCoupon';
import { RemoveCouponCommand } from '../../application/useCases/RemoveCoupon';
import { CreatePaymentIntentCommand } from '../../application/useCases/CreatePaymentIntent';
import { CompleteCheckoutCommand } from '../../application/useCases/CompleteCheckout';
import { AbandonCheckoutCommand } from '../../application/useCases/AbandonCheckout';
import {
  abandonCheckoutUseCase,
  applyCouponUseCase,
  completeCheckoutUseCase,
  createPaymentIntentUseCase,
  initiateCheckoutUseCase,
  manageCheckoutSessionUseCase,
  removeCouponUseCase,
  setBillingAddressUseCase,
  setPaymentMethodUseCase,
  setShippingAddressUseCase,
  setShippingMethodUseCase,
} from '../../application/useCases/wired';

export const checkoutResolvers = {
  Query: {
    checkout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const session = await manageCheckoutSessionUseCase.findById(args.checkoutId);
      if (!session) return null;
      return mapCheckoutToResponse(session);
    },
  },

  Mutation: {
    initiateCheckout: async (
      _parent: unknown,
      args: {
        basketId: string;
        customerId?: string;
        guestEmail?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = initiateCheckoutUseCase;
      const command = new InitiateCheckoutCommand(args.basketId, args.customerId, args.guestEmail);
      return useCase.execute(command);
    },

    setShippingAddress: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        address: {
          firstName: string;
          lastName: string;
          addressLine1: string;
          city: string;
          postalCode: string;
          country: string;
          company?: string;
          addressLine2?: string;
          region?: string;
          phone?: string;
        };
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = setShippingAddressUseCase;
      const a = args.address;
      const command = new SetShippingAddressCommand(
        args.checkoutId,
        a.firstName,
        a.lastName,
        a.addressLine1,
        a.city,
        a.postalCode,
        a.country,
        a.company,
        a.addressLine2,
        a.region,
        a.phone,
      );
      return useCase.execute(command);
    },

    setBillingAddress: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        address: {
          firstName: string;
          lastName: string;
          addressLine1: string;
          city: string;
          postalCode: string;
          country: string;
          company?: string;
          addressLine2?: string;
          region?: string;
          phone?: string;
        };
        sameAsShipping?: boolean;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = setBillingAddressUseCase;
      const a = args.address;
      const command = new SetBillingAddressCommand(
        args.checkoutId,
        a.firstName,
        a.lastName,
        a.addressLine1,
        a.city,
        a.postalCode,
        a.country,
        a.company,
        a.addressLine2,
        a.region,
        a.phone,
        args.sameAsShipping ?? false,
      );
      return useCase.execute(command);
    },

    setShippingMethod: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        shippingMethodId: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = setShippingMethodUseCase;
      const command = new SetShippingMethodCommand(args.checkoutId, args.shippingMethodId);
      return useCase.execute(command);
    },

    setPaymentMethod: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        paymentMethodId: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = setPaymentMethodUseCase;
      const command = new SetPaymentMethodCommand(args.checkoutId, args.paymentMethodId);
      return useCase.execute(command);
    },

    applyCoupon: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        couponCode: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = applyCouponUseCase;
      const command = new ApplyCouponCommand(args.checkoutId, args.couponCode);
      return useCase.execute(command);
    },

    removeCoupon: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = removeCouponUseCase;
      const command = new RemoveCouponCommand(args.checkoutId);
      return useCase.execute(command);
    },

    createPaymentIntent: async (
      _parent: unknown,
      args: {
        checkoutId: string;
        customerId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const useCase = createPaymentIntentUseCase;
      const command = new CreatePaymentIntentCommand(args.checkoutId, args.customerId);
      return useCase.execute(command);
    },

    completeCheckout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = completeCheckoutUseCase;
      const command = new CompleteCheckoutCommand(args.checkoutId);
      return useCase.execute(command);
    },

    abandonCheckout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = abandonCheckoutUseCase;
      const command = new AbandonCheckoutCommand(args.checkoutId);
      return useCase.execute(command);
    },
  },
};
