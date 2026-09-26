import loyaltyDataRepository, { LoyaltyPointsAction } from '../infrastructure/repositories/LoyaltyDataRepository';
import type { LoyaltyRepository } from '../domain/repositories/LoyaltyRepository';
import { ManageLoyaltyAdminUseCase } from './useCases/ManageLoyaltyAdmin';
import { ManageStorefrontLoyaltyUseCase } from './useCases/ManageStorefrontLoyalty';
import { AdjustCustomerPointsUseCase, type AdjustCustomerPointsPort } from './useCases/AdjustCustomerPoints';

export { loyaltyDataRepository, LoyaltyPointsAction };

export const manageLoyaltyAdminUseCase = new ManageLoyaltyAdminUseCase(
  loyaltyDataRepository.points as LoyaltyRepository,
);

const customerPointsAdapter: AdjustCustomerPointsPort = {
  findCustomerPoints: (customerId) => loyaltyDataRepository.points.findCustomerPoints(customerId),
  initializeCustomerPoints: (customerId, tierId) => loyaltyDataRepository.points.initializeCustomerPoints(customerId, tierId),
  adjustCustomerPoints: (customerId, points, reason) =>
    loyaltyDataRepository.points.adjustCustomerPoints(customerId, points, LoyaltyPointsAction.MANUAL_ADJUSTMENT, reason),
};

export const adjustCustomerPointsUseCase = new AdjustCustomerPointsUseCase(customerPointsAdapter);

export const manageStorefrontLoyaltyUseCase = new ManageStorefrontLoyaltyUseCase(
  loyaltyDataRepository.storefront as LoyaltyRepository,
);

import { CheckPointsBalanceUseCase } from './useCases/CheckPointsBalance';
import { GetPointsHistoryUseCase } from './useCases/GetPointsHistory';
import { CalculateTierStatusUseCase } from './useCases/CalculateTierStatus';
import { EarnPointsUseCase } from './useCases/EarnPoints';
import { RedeemPointsUseCase } from './useCases/RedeemPoints';
import { CreateRewardUseCase } from './useCases/CreateReward';
import { RedeemRewardUseCase } from './useCases/RedeemReward';

export const checkPointsBalanceUseCase = new CheckPointsBalanceUseCase(loyaltyDataRepository.points as never);
export const getPointsHistoryUseCase = new GetPointsHistoryUseCase(loyaltyDataRepository.points as never);
export const calculateTierStatusUseCase = new CalculateTierStatusUseCase(loyaltyDataRepository.points as never);
export const earnPointsUseCase = new EarnPointsUseCase(
  loyaltyDataRepository.points as never,
  loyaltyDataRepository.points as never,
);
export const redeemPointsUseCase = new RedeemPointsUseCase(
  loyaltyDataRepository.points as never,
  loyaltyDataRepository.points as never,
);
export const createRewardUseCase = new CreateRewardUseCase(loyaltyDataRepository.points as never);
export const redeemRewardUseCase = new RedeemRewardUseCase(loyaltyDataRepository.points as never);
