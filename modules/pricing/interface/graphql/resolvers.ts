import PriceListRepo from '../../infrastructure/repositories/pricingPriceListRepo';
import ProductCurrencyPriceRepo from '../../infrastructure/repositories/productCurrencyPriceRepo';
import productTierPriceRepo from '../../infrastructure/repositories/productTierPriceRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculatePriceUseCase, CalculatePriceInput } from '../../application/useCases/CalculatePrice';
import { CreatePriceListUseCase, CreatePriceListInput } from '../../application/useCases/CreatePriceList';
import { SetProductPriceUseCase, SetProductPriceInput } from '../../application/useCases/SetProductPrice';

export const pricingResolvers = {
  Query: {
    calculatePrice: async (_parent: unknown, args: { input: CalculatePriceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const pricingRepository = {
        getPriceListItem: async (priceListId: string, productId: string, _variantId?: string) => {
          const price = await ProductCurrencyPriceRepo.findByProductAndCurrency(productId, priceListId);
          return price ? { price: parseFloat(price.price) } : null;
        },
        getVolumeDiscount: async (productId: string, quantity: number) => {
          const tierPrices = await productTierPriceRepo.findForProduct(productId);
          const applicable = tierPrices.find(tp => tp.quantityMin <= quantity);
          if (!applicable) return null;
          return { discountPercent: 0 };
        },
        getActiveSalePrice: async (productId: string, _variantId?: string) => {
          const prices = await ProductCurrencyPriceRepo.findByProduct(productId);
          const salePrice = prices.find(p => p.compareAtPrice !== null);
          return salePrice ? parseFloat(salePrice.price) : null;
        },
      };
      const productRepository = {
        findById: async (id: string) => {
          const prices = await ProductCurrencyPriceRepo.findByProduct(id);
          if (prices.length === 0) return null;
          return { price: parseFloat(prices[0].price), currencyCode: undefined };
        },
        findVariantById: async (id: string) => {
          const prices = await ProductCurrencyPriceRepo.findByVariant(id);
          if (prices.length === 0) return null;
          return { price: parseFloat(prices[0].price) };
        },
      };
      const useCase = new CalculatePriceUseCase(pricingRepository, productRepository);
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
          const result = await PriceListRepo.create({
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
          priceListId?: string;
          price: number;
          salePrice?: number;
          saleStartDate?: Date;
          saleEndDate?: Date;
          currencyCode: string;
        }) => {
          const existing = await ProductCurrencyPriceRepo.findByProductAndCurrency(
            data.productId,
            data.currencyCode,
            data.variantId,
          );
          if (existing) {
            const updated = await ProductCurrencyPriceRepo.updatePrice(existing.productCurrencyPriceId, data.price);
            return {
              productId: data.productId,
              variantId: data.variantId,
              price: data.price,
              salePrice: data.salePrice,
              updatedAt: updated ? new Date(updated.updatedAt) : new Date(),
            };
          }
          const created = await ProductCurrencyPriceRepo.upsert({
            productId: data.productId,
            productVariantId: data.variantId ?? null,
            currencyId: data.currencyCode,
            price: String(data.price),
            compareAtPrice: data.salePrice ? String(data.salePrice) : null,
            isManual: true,
            updatedBy: null,
          });
          return {
            productId: created.productId,
            variantId: data.variantId,
            price: data.price,
            salePrice: data.salePrice,
            updatedAt: new Date(created.updatedAt),
          };
        },
      };
      const useCase = new SetProductPriceUseCase(repository);
      const input: SetProductPriceInput = {
        ...args.input,
        saleStartDate: args.input.saleStartDate ? new Date(args.input.saleStartDate) : undefined,
        saleEndDate: args.input.saleEndDate ? new Date(args.input.saleEndDate) : undefined,
      };
      return useCase.execute(input);
    },
  },
};
