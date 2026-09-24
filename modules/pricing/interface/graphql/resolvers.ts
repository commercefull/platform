import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculatePriceUseCase, CalculatePriceInput } from '../../application/useCases/CalculatePrice';
import { CreatePriceListUseCase, CreatePriceListInput } from '../../application/useCases/CreatePriceList';
import { SetProductPriceUseCase, SetProductPriceInput } from '../../application/useCases/SetProductPrice';
import { pricingDataRepository } from '../../application/wired';
import { PricingAdjustmentType } from '../../domain/pricingRule';

export const pricingResolvers = {
  Query: {
    calculatePrice: async (_parent: unknown, args: { input: CalculatePriceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const pricingRepository = {
        getBasePrice: async (productId: string, variantId?: string) => {
          const row = await pricingDataRepository.basePrices.findEffective(productId, variantId);
          return row ? { priceCents: row.priceCents, salePriceCents: row.salePriceCents, currencyCode: row.currencyCode } : null;
        },
        getPriceListItem: async (priceListId: string, productId: string, variantId?: string) => {
          const prices = await pricingDataRepository.customerPrices.findPricesForProduct(productId, variantId, [priceListId]);
          const entry = prices.find(
            p => p.adjustmentType === PricingAdjustmentType.OVERRIDE || p.adjustmentType === PricingAdjustmentType.FIXED,
          );
          // Price-list amounts are stored in major units — convert to cents
          return entry ? { priceCents: Math.round(entry.adjustmentValue * 100) } : null;
        },
        getTierPrice: async (productId: string, quantity: number, variantId?: string) => {
          const tier = await pricingDataRepository.tierPrices.findApplicableTier(productId, quantity, variantId);
          return tier ? { priceCents: tier.priceCents } : null;
        },
      };
      const useCase = new CalculatePriceUseCase(pricingRepository);
      return useCase.execute(args.input);
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
