import taxQueryRepo from '../../infrastructure/repositories/taxQueryRepo';
import { TaxCommandRepo } from '../../infrastructure/repositories/taxCommandRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CalculateOrderTaxUseCase, CalculateOrderTaxCommand, OrderLineItem, TaxAddress } from '../../application/useCases/CalculateOrderTax';
import { CreateTaxRateUseCase, CreateTaxRateInput } from '../../application/useCases/CreateTaxRate';
import { GetTaxRateForAddressUseCase, GetTaxRateForAddressInput } from '../../application/useCases/GetTaxRateForAddress';
import type { TaxRateType } from '../../taxTypes';

// Adapter that bridges taxQueryRepo to the TaxRepository port interface
const taxRepoAdapter = {
  async findRatesForAddress(params: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
    taxCategory?: string;
  }) {
    const zone = await taxQueryRepo.findTaxZoneForAddress(params.country, params.state, params.postalCode, params.city);
    if (!zone) return [];

    const defaultCategory = params.taxCategory
      ? await taxQueryRepo.findTaxCategoryByCode(params.taxCategory)
      : await taxQueryRepo.findDefaultTaxCategory();

    if (!defaultCategory) return [];

    const rates = await taxQueryRepo.findTaxRatesByCategoryAndZone(defaultCategory.id, zone.id, true);
    return rates.map(r => ({
      taxRateId: r.id,
      name: r.name,
      rate: r.rate,
      isCompound: r.isCompound,
      includesShipping: r.isShippingTaxable,
      priority: r.priority,
    }));
  },
};

// Adapter for customer tax exemption lookups
const customerRepoAdapter = {
  async getTaxExemption(customerId: string) {
    const exemptions = await taxQueryRepo.findCustomerTaxExemptions(customerId);
    if (exemptions.length === 0) return null;
    return { isActive: true, reason: exemptions[0].type };
  },
};

// Adapter that bridges TaxCommandRepo to the CreateTaxRate port interface
const taxCommandAdapter = {
  async createTaxRate(data: Record<string, unknown>) {
    const commandRepo = new TaxCommandRepo();
    const result = await commandRepo.createTaxRate({
      taxCategoryId: data.taxCategory as string || '',
      taxZoneId: '',
      name: data.name as string,
      rate: data.rate as number,
      type: ((data.type as string) || 'percentage') as TaxRateType,
      priority: (data.priority as number) || 0,
      isCompound: (data.isCompound as boolean) || false,
      includeInPrice: false,
      isShippingTaxable: (data.includesShipping as boolean) || false,
      startDate: Math.floor(Date.now() / 1000),
      isActive: (data.isActive as boolean) ?? true,
    });
    return {
      taxRateId: result.id,
      name: result.name,
      rate: result.rate,
      country: '',
      isActive: result.isActive,
      createdAt: new Date(result.createdAt * 1000),
    };
  },
};

export const taxResolvers = {
  Query: {
    taxRateForAddress: async (_parent: unknown, args: { input: GetTaxRateForAddressInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetTaxRateForAddressUseCase(taxRepoAdapter, customerRepoAdapter);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    calculateOrderTax: async (_parent: unknown, args: {
      input: {
        items: OrderLineItem[];
        shippingAddress: TaxAddress;
        shippingAmount?: number;
        customerId?: string;
      };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CalculateOrderTaxUseCase();
      const command = new CalculateOrderTaxCommand(
        args.input.items,
        args.input.shippingAddress,
        args.input.shippingAmount ?? 0,
        args.input.customerId,
      );
      return useCase.execute(command);
    },

    createTaxRate: async (_parent: unknown, args: { input: CreateTaxRateInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateTaxRateUseCase(taxCommandAdapter);
      return useCase.execute(args.input);
    },
  },
};
