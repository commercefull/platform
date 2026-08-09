import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from '../../application/useCases/CalculateShippingRates';
import { GetShippingMethodsUseCase, GetShippingMethodsQuery } from '../../application/useCases/GetShippingMethods';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const shippingResolvers = {
  Query: {
    shippingRates: async (_parent: unknown, args: {
      destinationAddress: { country: string; state?: string; city?: string; postalCode?: string };
      orderDetails: { subtotal: number; itemCount: number; totalWeight?: number; currency?: string };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CalculateShippingRatesUseCase();
      const command = new CalculateShippingRatesCommand(args.destinationAddress, args.orderDetails);
      return useCase.execute(command);
    },

    shippingMethods: async (_parent: unknown, args: {
      activeOnly?: boolean;
      displayOnFrontend?: boolean;
      carrierId?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetShippingMethodsUseCase();
      const query = new GetShippingMethodsQuery(
        args.activeOnly ?? true,
        args.displayOnFrontend ?? false,
        args.carrierId,
      );
      return useCase.execute(query);
    },
  },
};
