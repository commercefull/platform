import CheckoutRepo from '../../infrastructure/repositories/CheckoutRepository';
import { getCheckoutPorts } from '../../../../boot/container';
import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { InitiateCheckoutUseCase, InitiateCheckoutCommand, mapCheckoutToResponse } from '../../application/useCases/InitiateCheckout';
import { SetShippingAddressUseCase, SetShippingAddressCommand } from '../../application/useCases/SetShippingAddress';
import { SetBillingAddressUseCase, SetBillingAddressCommand } from '../../application/useCases/SetBillingAddress';
import { SetShippingMethodUseCase, SetShippingMethodCommand } from '../../application/useCases/SetShippingMethod';
import { SetPaymentMethodUseCase, SetPaymentMethodCommand } from '../../application/useCases/SetPaymentMethod';
import { ApplyCouponUseCase, ApplyCouponCommand } from '../../application/useCases/ApplyCoupon';
import { RemoveCouponUseCase, RemoveCouponCommand } from '../../application/useCases/RemoveCoupon';
import { CreatePaymentIntentUseCase, CreatePaymentIntentCommand } from '../../application/useCases/CreatePaymentIntent';
import { CompleteCheckoutUseCase, CompleteCheckoutCommand } from '../../application/useCases/CompleteCheckout';
import { AbandonCheckoutUseCase, AbandonCheckoutCommand } from '../../application/useCases/AbandonCheckout';

export const checkoutResolvers = {
  Query: {
    checkout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const session = await CheckoutRepo.findById(args.checkoutId);
      if (!session) return null;
      return mapCheckoutToResponse(session);
    },
  },

  Mutation: {
    initiateCheckout: async (_parent: unknown, args: {
      basketId: string;
      customerId?: string;
      guestEmail?: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new InitiateCheckoutUseCase(CheckoutRepo, ports.basketSnapshot);
      const command = new InitiateCheckoutCommand(args.basketId, args.customerId, args.guestEmail);
      return useCase.execute(command);
    },

    setShippingAddress: async (_parent: unknown, args: {
      checkoutId: string;
      address: {
        firstName: string; lastName: string; addressLine1: string; city: string;
        postalCode: string; country: string; company?: string; addressLine2?: string;
        region?: string; phone?: string;
      };
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new SetShippingAddressUseCase(CheckoutRepo, ports.basketSnapshot, ports.taxQuote, ports.promotionQuote);
      const a = args.address;
      const command = new SetShippingAddressCommand(
        args.checkoutId, a.firstName, a.lastName, a.addressLine1, a.city,
        a.postalCode, a.country, a.company, a.addressLine2, a.region, a.phone,
      );
      return useCase.execute(command);
    },

    setBillingAddress: async (_parent: unknown, args: {
      checkoutId: string;
      address: {
        firstName: string; lastName: string; addressLine1: string; city: string;
        postalCode: string; country: string; company?: string; addressLine2?: string;
        region?: string; phone?: string;
      };
      sameAsShipping?: boolean;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new SetBillingAddressUseCase(CheckoutRepo);
      const a = args.address;
      const command = new SetBillingAddressCommand(
        args.checkoutId, a.firstName, a.lastName, a.addressLine1, a.city,
        a.postalCode, a.country, a.company, a.addressLine2, a.region, a.phone,
        args.sameAsShipping ?? false,
      );
      return useCase.execute(command);
    },

    setShippingMethod: async (_parent: unknown, args: {
      checkoutId: string;
      shippingMethodId: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new SetShippingMethodUseCase(CheckoutRepo, ports.shippingQuote);
      const command = new SetShippingMethodCommand(args.checkoutId, args.shippingMethodId);
      return useCase.execute(command);
    },

    setPaymentMethod: async (_parent: unknown, args: {
      checkoutId: string;
      paymentMethodId: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new SetPaymentMethodUseCase(CheckoutRepo);
      const command = new SetPaymentMethodCommand(args.checkoutId, args.paymentMethodId);
      return useCase.execute(command);
    },

    applyCoupon: async (_parent: unknown, args: {
      checkoutId: string;
      couponCode: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new ApplyCouponUseCase(CheckoutRepo, ports.discountQuote);
      const command = new ApplyCouponCommand(args.checkoutId, args.couponCode);
      return useCase.execute(command);
    },

    removeCoupon: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new RemoveCouponUseCase(CheckoutRepo);
      const command = new RemoveCouponCommand(args.checkoutId);
      return useCase.execute(command);
    },

    createPaymentIntent: async (_parent: unknown, args: {
      checkoutId: string;
      customerId?: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new CreatePaymentIntentUseCase(
        CheckoutRepo,
        ports.basketSnapshot,
        ports.orderPlacement,
        ports.paymentAuthorization,
      );
      const command = new CreatePaymentIntentCommand(args.checkoutId, args.customerId);
      return useCase.execute(command);
    },

    completeCheckout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new CompleteCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
      const command = new CompleteCheckoutCommand(args.checkoutId);
      return useCase.execute(command);
    },

    abandonCheckout: async (_parent: unknown, args: { checkoutId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const ports = getCheckoutPorts();
      const useCase = new AbandonCheckoutUseCase(CheckoutRepo, ports.orderPlacement);
      const command = new AbandonCheckoutCommand(args.checkoutId);
      return useCase.execute(command);
    },
  },
};
