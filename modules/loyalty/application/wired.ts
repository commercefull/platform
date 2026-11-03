import loyaltyDataRepository, { LoyaltyPointsAction } from '../infrastructure/repositories/LoyaltyDataRepository';
import type { CreateLoyaltyRewardInput } from '../domain/repositories/LoyaltyRewardRepository';
import { ManageLoyaltyAdminUseCase } from './useCases/ManageLoyaltyAdmin';
import { ManageStorefrontLoyaltyUseCase } from './useCases/ManageStorefrontLoyalty';
import { AdjustCustomerPointsUseCase, type AdjustCustomerPointsPort } from './useCases/AdjustCustomerPoints';

export { loyaltyDataRepository, LoyaltyPointsAction };

export const manageLoyaltyAdminUseCase = new ManageLoyaltyAdminUseCase(loyaltyDataRepository.points);

const customerPointsAdapter: AdjustCustomerPointsPort = {
  findCustomerPoints: customerId => loyaltyDataRepository.points.findCustomerPoints(customerId),
  initializeCustomerPoints: (customerId, tierId) => loyaltyDataRepository.points.initializeCustomerPoints(customerId, tierId),
  adjustCustomerPoints: (customerId, points, reason) =>
    loyaltyDataRepository.points.adjustCustomerPoints({
      customerId,
      pointsChange: points,
      action: LoyaltyPointsAction.MANUAL_ADJUSTMENT,
      description: reason,
    }),
};

export const adjustCustomerPointsUseCase = new AdjustCustomerPointsUseCase(customerPointsAdapter);

export const manageStorefrontLoyaltyUseCase = new ManageStorefrontLoyaltyUseCase(
  loyaltyDataRepository.storefront,
  loyaltyDataRepository.points,
);

import { CheckPointsBalanceUseCase, type CheckPointsBalanceRepository } from './useCases/CheckPointsBalance';
import { RedeemPointsUseCase, type RedeemPointsRepository, type RedeemPointsRewardRepository } from './useCases/RedeemPoints';
import { CreateRewardUseCase, type CreateRewardRepository } from './useCases/CreateReward';

const checkPointsBalanceRepository: CheckPointsBalanceRepository = {
  findMemberByCustomerId: async customerId => {
    const member = await loyaltyDataRepository.points.findCustomerPointsWithTier(customerId);
    if (!member) return null;
    return {
      availablePoints: member.points.currentPoints,
      pendingPoints: 0,
      lifetimePoints: member.points.lifetimePoints,
      tier: {
        tierId: member.tier.tierId,
        name: member.tier.name,
        multiplier: Number(member.tier.pointsMultiplier) || 1,
      },
    };
  },
  findNextTier: async tierId => {
    const current = await loyaltyDataRepository.points.findTierById(tierId);
    if (!current) return null;
    const tiers = await loyaltyDataRepository.points.findAllTiers();
    const next = tiers.filter(t => t.pointsThreshold > current.pointsThreshold).sort((a, b) => a.pointsThreshold - b.pointsThreshold)[0];
    return next ? { name: next.name, requiredPoints: next.pointsThreshold } : null;
  },
};

export const checkPointsBalanceUseCase = new CheckPointsBalanceUseCase(checkPointsBalanceRepository);

// Maps use-case member semantics (memberId = loyaltyPointsId, availablePoints =
// currentPoints) onto the loyaltyRepo surface — loyaltyRepo itself has no
// findMemberByCustomerId/updateMemberPoints.
const redeemPointsRepository: RedeemPointsRepository = {
  findMemberByCustomerId: async customerId => {
    const points = await loyaltyDataRepository.points.findCustomerPoints(customerId);
    return points ? { memberId: points.loyaltyPointsId, availablePoints: points.currentPoints } : null;
  },
  createTransaction: async data =>
    loyaltyDataRepository.points.createTransaction({
      customerId: data.customerId as string,
      orderId: data.orderId as string | undefined,
      action: 'redeem',
      points: data.points as number,
      description: data.description as string | undefined,
      referenceId: (data.rewardId ?? data.referenceId) as string | undefined,
    }),
  updateMemberPoints: async (memberId, data) => {
    await loyaltyDataRepository.points.setMemberPoints(memberId, data.availablePoints);
  },
  findTransactionByOrderAndAction: (orderId, action) => loyaltyDataRepository.points.findTransactionByOrderAndAction(orderId, action),
};

const redeemPointsRewardRepository: RedeemPointsRewardRepository = {
  findById: async rewardId => {
    const reward = await loyaltyDataRepository.points.findRewardById(rewardId);
    if (!reward) return null;
    return {
      isActive: reward.isActive === true,
      pointsCost: reward.pointsCost,
      discountValue: reward.value !== null ? Number(reward.value) : undefined,
      name: reward.name,
    };
  },
};

export const redeemPointsUseCase = new RedeemPointsUseCase(redeemPointsRepository, redeemPointsRewardRepository);

const createRewardRepository: CreateRewardRepository = {
  createReward: async data => {
    const reward = await loyaltyDataRepository.points.createReward(data as unknown as CreateLoyaltyRewardInput);
    return {
      rewardId: reward.rewardId,
      name: reward.name,
      pointsCost: reward.pointsCost,
      type: reward.type ?? 'discount',
      isActive: reward.isActive === true,
      createdAt: reward.createdAt ?? new Date(),
    };
  },
};

export const createRewardUseCase = new CreateRewardUseCase(createRewardRepository);
