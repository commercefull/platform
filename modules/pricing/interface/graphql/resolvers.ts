import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculatePriceInput } from '../../application/useCases/CalculatePrice';
import type { CreatePriceListInput } from '../../application/useCases/CreatePriceList';
import type { SetProductPriceInput } from '../../application/useCases/SetProductPrice';
import { calculatePriceUseCase, createPriceListUseCase, setProductPriceUseCase } from '../../application/wired';

export const pricingResolvers = {
  Query: {
    calculatePrice: async (_parent: unknown, args: { input: CalculatePriceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const result = await calculatePriceUseCase.execute(args.input);

      // Map the PricingResult onto the GraphQL CalculatePriceResult shape
      const discountOf = (prefix: string) => {
        const impact = result.appliedRules.find(r => r.ruleName.startsWith(prefix))?.impact;
        return impact && impact > 0 ? impact : undefined;
      };

      return {
        unitPriceCents: result.finalPriceCents,
        totalPriceCents: result.finalPriceCents * (args.input.quantity ?? 1),
        currency: result.currency,
        breakdown: {
          basePriceCents: result.originalPriceCents,
          volumeDiscountCents: discountOf('Tier Pricing'),
          customerDiscountCents: discountOf('Customer Price'),
          finalPriceCents: result.finalPriceCents,
          currency: result.currency,
          appliedRules: result.appliedRules.map(r => r.ruleName),
        },
      };
    },
  },

  Mutation: {
    createPriceList: async (_parent: unknown, args: { input: CreatePriceListInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = createPriceListUseCase;
      const input: CreatePriceListInput = {
        ...args.input,
        validFrom: args.input.validFrom ? new Date(args.input.validFrom) : undefined,
        validTo: args.input.validTo ? new Date(args.input.validTo) : undefined,
      };
      return useCase.execute(input);
    },

    setProductPrice: async (_parent: unknown, args: { input: SetProductPriceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = setProductPriceUseCase;
      return useCase.execute(args.input);
    },
  },
};
