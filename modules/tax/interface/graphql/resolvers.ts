import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculateOrderTaxCommand, OrderLineItem, TaxAddress } from '../../application/useCases/CalculateOrderTax';
import type { CreateTaxRateInput } from '../../application/useCases/CreateTaxRate';
import type { GetTaxRateForAddressInput } from '../../application/useCases/GetTaxRateForAddress';
import {
  calculateOrderTaxUseCase,
  getTaxRateForAddressUseCase,
  createTaxRateUseCase,
} from '../../application/wired';

export const taxResolvers = {
  Query: {
    taxRateForAddress: async (_parent: unknown, args: { input: GetTaxRateForAddressInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return getTaxRateForAddressUseCase.execute(args.input);
    },
  },

  Mutation: {
    calculateOrderTax: async (
      _parent: unknown,
      args: {
        input: {
          items: OrderLineItem[];
          shippingAddress: TaxAddress;
          shippingAmount?: number;
          customerId?: string;
        };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new CalculateOrderTaxCommand(
        args.input.items,
        args.input.shippingAddress,
        args.input.shippingAmount ?? 0,
        args.input.customerId,
      );
      return calculateOrderTaxUseCase.execute(command);
    },

    createTaxRate: async (_parent: unknown, args: { input: CreateTaxRateInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return createTaxRateUseCase.execute(args.input);
    },
  },
};
