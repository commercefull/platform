import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculatePriceInput } from '../../application/useCases/CalculatePrice';
import { CreatePriceListUseCase, CreatePriceListInput } from '../../application/useCases/CreatePriceList';
import { SetProductPriceUseCase, SetProductPriceInput } from '../../application/useCases/SetProductPrice';
import { calculatePriceUseCase, pricingDataRepository } from '../../application/wired';

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
      const repository = {
        createPriceList: async (data: {
          priceListId: string;
          name: string;
          description?: string;
          currencyCode: string;
          type: string;
          isDefault: boolean;
          validFrom?: Date;
          validTo?: Date;
          storeIds: string[];
          isActive: boolean;
        }) => {
          const result = await pricingDataRepository.priceLists.create({
            name: data.name,
            description: data.description,
            priority: 0,
            isActive: data.isActive,
            startDate: data.validFrom?.toISOString(),
            endDate: data.validTo?.toISOString(),
          });
          return {
            priceListId: result.priceListId,
            name: result.name,
            type: data.type,
            currencyCode: data.currencyCode,
            isDefault: data.isDefault,
            createdAt: new Date(result.createdAt),
          };
        },
      };
      const useCase = new CreatePriceListUseCase(repository);
      const input: CreatePriceListInput = {
        ...args.input,
        validFrom: args.input.validFrom ? new Date(args.input.validFrom) : undefined,
        validTo: args.input.validTo ? new Date(args.input.validTo) : undefined,
      };
      return useCase.execute(input);
    },

    setProductPrice: async (_parent: unknown, args: { input: SetProductPriceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const repository = {
        setPrice: async (data: {
          productId: string;
          variantId?: string;
          priceCents: number;
          salePriceCents?: number;
          currencyCode: string;
        }) => {
          const saved = await pricingDataRepository.basePrices.upsert({
            productId: data.productId,
            productVariantId: data.variantId ?? null,
            currencyCode: data.currencyCode,
            priceCents: data.priceCents,
            salePriceCents: data.salePriceCents ?? null,
          });
          return {
            productId: saved.productId,
            variantId: saved.productVariantId ?? undefined,
            priceCents: saved.priceCents,
            salePriceCents: saved.salePriceCents,
            updatedAt: saved.updatedAt,
          };
        },
      };
      const useCase = new SetProductPriceUseCase(repository);
      return useCase.execute(args.input);
    },
  },
};
