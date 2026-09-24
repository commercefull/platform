import { CalculateShippingRatesCommand } from '../../application/useCases/CalculateShippingRates';
import { GetShippingMethodsQuery } from '../../application/useCases/GetShippingMethods';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import {
  shippingConfigRepository,
  calculateShippingRatesUseCase,
  getShippingMethodsUseCase,
} from '../../application/wired';
import type { CreateShippingSurchargeInput, UpdateShippingSurchargeInput } from '../../application/wired';

const surchargeRepo = shippingConfigRepository.surcharges;

export const shippingResolvers = {
  Query: {
    shippingRates: async (
      _parent: unknown,
      args: {
        destinationAddress: { country: string; state?: string; city?: string; postalCode?: string };
        orderDetails: { subtotalCents: number; itemCount: number; totalWeight?: number; currency?: string };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new CalculateShippingRatesCommand(args.destinationAddress, args.orderDetails);
      return calculateShippingRatesUseCase.execute(command);
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
      const query = new GetShippingMethodsQuery(args.activeOnly ?? true, args.displayOnFrontend ?? false, args.carrierId);
      return getShippingMethodsUseCase.execute(query);
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
