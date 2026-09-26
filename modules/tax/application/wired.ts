import taxQueryRepository from '../infrastructure/repositories/TaxQueryRepository';
import taxCommandRepository from '../infrastructure/repositories/TaxCommandRepository';
import { BasketTaxableBasketAdapter } from '../infrastructure/acl/BasketTaxableBasketAdapter';
import { TaxQueryRepository } from '../infrastructure';
import { CalculateOrderTaxUseCase } from './useCases/CalculateOrderTax';
import { ApproveTaxExemptionUseCase } from './useCases/ApproveTaxExemption';
import { RejectTaxExemptionUseCase } from './useCases/RejectTaxExemption';
import { CreateTaxExemptionUseCase } from './useCases/CreateTaxExemption';
import { ManageAdminTaxUseCase } from './useCases/ManageAdminTax';
import { CalculateLineItemTaxUseCase } from './useCases/CalculateLineItemTax';
import { CalculateBasketTaxUseCase } from './useCases/CalculateBasketTax';
import { CreateTaxRateRecordUseCase } from './useCases/CreateTaxRateRecord';
import { CreateTaxCategoryUseCase } from './useCases/CreateTaxCategory';
import { CreateTaxZoneUseCase } from './useCases/CreateTaxZone';
import { UpdateTaxZoneUseCase } from './useCases/UpdateTaxZone';
import { ManageTaxRecordsUseCase } from './useCases/ManageTaxRecords';
import { GetTaxRateForAddressUseCase } from './useCases/GetTaxRateForAddress';
import { CreateTaxRateUseCase } from './useCases/CreateTaxRate';
import type { TaxRateType } from '../taxTypes';
import basketRepo from '../../basket/infrastructure/repositories/BasketRepository';

export const taxCommandRepo = taxCommandRepository.commands;

export const calculateOrderTaxUseCase = new CalculateOrderTaxUseCase(taxQueryRepository.query);
export const approveTaxExemptionUseCase = new ApproveTaxExemptionUseCase(taxCommandRepo);
export const rejectTaxExemptionUseCase = new RejectTaxExemptionUseCase(taxCommandRepo);
export const createTaxExemptionUseCase = new CreateTaxExemptionUseCase(taxCommandRepo);
export const manageAdminTaxUseCase = new ManageAdminTaxUseCase(taxQueryRepository.admin);

export const taxableBasketAdapter = new BasketTaxableBasketAdapter(basketRepo);

export const calculateLineItemTaxUseCase = new CalculateLineItemTaxUseCase(taxQueryRepository.query);
export const calculateBasketTaxUseCase = new CalculateBasketTaxUseCase(taxableBasketAdapter, taxQueryRepository.query);
export const createTaxRateRecordUseCase = new CreateTaxRateRecordUseCase(taxCommandRepo);
export const createTaxCategoryUseCase = new CreateTaxCategoryUseCase(taxCommandRepo);
export const createTaxZoneUseCase = new CreateTaxZoneUseCase(taxCommandRepo);
export const updateTaxZoneUseCase = new UpdateTaxZoneUseCase({
  findTaxZoneById: id => taxQueryRepository.query.findTaxZoneById(id),
  updateTaxZone: (id, zone) => taxCommandRepository.commands.updateTaxZone(id, zone),
});

export const manageTaxRecordsUseCase = new ManageTaxRecordsUseCase(
  taxQueryRepository.query,
  taxCommandRepository.commands,
);

const taxRateQueryAdapter = {
  async findRatesForAddress(params: { country: string; state?: string; city?: string; postalCode?: string; taxCategory?: string }) {
    const zone = await taxQueryRepository.query.findTaxZoneForAddress(params.country, params.state, params.postalCode, params.city);
    if (!zone) return [];

    const defaultCategory = params.taxCategory
      ? await taxQueryRepository.query.findTaxCategoryByCode(params.taxCategory)
      : await taxQueryRepository.query.findDefaultTaxCategory();

    if (!defaultCategory) return [];

    const rates = await taxQueryRepository.query.findTaxRatesByCategoryAndZone(defaultCategory.id, zone.id, true);
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

const taxCustomerExemptionAdapter = {
  async getTaxExemption(customerId: string) {
    const exemptions = await taxQueryRepository.query.findCustomerTaxExemptions(customerId);
    if (exemptions.length === 0) return null;
    return { isActive: true, reason: exemptions[0].type };
  },
};

const taxCommandAdapter = {
  async createTaxRate(data: Record<string, unknown>) {
    const result = await taxCommandRepository.commands.createTaxRate({
      taxCategoryId: (data.taxCategory as string) || '',
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

export const getTaxRateForAddressUseCase = new GetTaxRateForAddressUseCase(taxRateQueryAdapter, taxCustomerExemptionAdapter);
export const createTaxRateUseCase = new CreateTaxRateUseCase(taxCommandAdapter);

export { taxQueryRepository, taxCommandRepository };

export { TaxQueryRepository };
