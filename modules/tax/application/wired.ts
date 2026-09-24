import taxQueryRepository from '../infrastructure/repositories/TaxQueryRepository';
import taxCommandRepository from '../infrastructure/repositories/TaxCommandRepository';
import { BasketTaxableBasketAdapter } from '../infrastructure/acl/BasketTaxableBasketAdapter';
import { TaxQueryRepository } from '../infrastructure';
import { CalculateOrderTaxUseCase } from './useCases/CalculateOrderTax';
import { ApproveTaxExemptionUseCase } from './useCases/ApproveTaxExemption';
import { RejectTaxExemptionUseCase } from './useCases/RejectTaxExemption';
import { CreateTaxExemptionUseCase } from './useCases/CreateTaxExemption';
import { ManageAdminTaxUseCase } from './useCases/ManageAdminTax';
import basketRepo from '../../basket/infrastructure/repositories/BasketRepository';

export const taxCommandRepo = taxCommandRepository.commands;

export const calculateOrderTaxUseCase = new CalculateOrderTaxUseCase(taxQueryRepository.query);
export const approveTaxExemptionUseCase = new ApproveTaxExemptionUseCase(taxCommandRepo);
export const rejectTaxExemptionUseCase = new RejectTaxExemptionUseCase(taxCommandRepo);
export const createTaxExemptionUseCase = new CreateTaxExemptionUseCase(taxCommandRepo);
export const manageAdminTaxUseCase = new ManageAdminTaxUseCase(taxQueryRepository.admin);

export const taxableBasketAdapter = new BasketTaxableBasketAdapter(basketRepo);

export { taxQueryRepository, taxCommandRepository };

export { TaxQueryRepository };
