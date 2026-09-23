import loyaltyDataRepository, { LoyaltyPointsAction } from '../infrastructure/repositories/LoyaltyDataRepository';
import type { LoyaltyRepository } from '../domain/repositories/LoyaltyRepository';
import { ManageLoyaltyAdminUseCase } from './useCases/ManageLoyaltyAdmin';
import { ManageStorefrontLoyaltyUseCase } from './useCases/ManageStorefrontLoyalty';

export { loyaltyDataRepository, LoyaltyPointsAction };

export const manageLoyaltyAdminUseCase = new ManageLoyaltyAdminUseCase(
  loyaltyDataRepository.points as LoyaltyRepository,
);

export const manageStorefrontLoyaltyUseCase = new ManageStorefrontLoyaltyUseCase(
  loyaltyDataRepository.storefront as LoyaltyRepository,
);
