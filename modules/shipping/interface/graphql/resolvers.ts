import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from '../../application/useCases/CalculateShippingRates';
import { GetShippingMethodsUseCase, GetShippingMethodsQuery } from '../../application/useCases/GetShippingMethods';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { shippingConfigRepository } from '../../application/wired';
import type { CreateShippingSurchargeInput, UpdateShippingSurchargeInput } from '../../application/wired';

const surchargeRepo = shippingConfigRepository.surcharges;

export const shippingResolvers = {
  Query: {
    shippingRates: async (
      _parent: unknown,
      args: {
        destinationAddress: { country: string; state?: string; city?: string; postalCode?: string };
        orderDetails: { subtotal: number; itemCount: number; totalWeight?: number; currency?: string };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const useCase = new CalculateShippingRatesUseCase();
      const command = new CalculateShippingRatesCommand(args.destinationAddress, args.orderDetails);
      return useCase.execute(command);
    },

    shippingMethods: async (
      _parent: unknown,
      args: {
        activeOnly?: boolean;
        displayOnFrontend?: boolean;
        carrierId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const useCase = new GetShippingMethodsUseCase();
      const query = new GetShippingMethodsQuery(args.activeOnly ?? true, args.displayOnFrontend ?? false, args.carrierId);
      return useCase.execute(query);
    },

    shippingSurcharges: async (_parent: unknown, args: { rateId: string; activeOnly?: boolean }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return surchargeRepo.findByRateId(args.rateId, args.activeOnly ?? true);
    },

    shippingSurcharge: async (_parent: unknown, args: { id: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return surchargeRepo.findById(args.id);
    },
  },
  Mutation: {
    createShippingSurcharge: async (_parent: unknown, args: { input: CreateShippingSurchargeInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return surchargeRepo.create(args.input);
    },

    updateShippingSurcharge: async (
      _parent: unknown,
      args: { id: string; input: UpdateShippingSurchargeInput },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      return surchargeRepo.update(args.id, args.input);
    },

    deleteShippingSurcharge: async (_parent: unknown, args: { id: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return surchargeRepo.delete(args.id);
    },
  },
};
