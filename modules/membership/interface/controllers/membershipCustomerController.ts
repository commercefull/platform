import type { HttpRequest, HttpResponse } from 'libs/http';
import { membershipSubscriptionDataRepository } from '../../application/wired';

const membershipRepo = membershipSubscriptionDataRepository.memberships;

// Public Membership Tier Endpoints
export const getMembershipTiers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  // For storefront, we only want to show active tiers
  const includeInactive = false;
  const tiers = await membershipRepo.findAllTiers(includeInactive);

  res.status(200).json({
    success: true,
    data: tiers,
  });
};

export const getMembershipTierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const tier = await membershipRepo.findTierById(id);

  // For storefront, only return active tiers
  if (!tier || !tier.isActive) {
    res.status(404).json({
      success: false,
      message: 'Membership tier not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: tier,
  });
};

export const getTierBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { tierId } = req.params;

  // Check if tier exists and is active
  const tier = await membershipRepo.findTierById(tierId);
  if (!tier || !tier.isActive) {
    res.status(404).json({
      success: false,
      message: 'Membership tier not found',
    });
    return;
  }

  const benefits = await membershipRepo.findBenefitsByTierId(tierId);

  res.status(200).json({
    success: true,
    data: benefits,
  });
};

// User Membership Public Endpoints
export const getUserMembershipByUserId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;
  const authenticatedUserId = req.user?.customerId || req.user?.id;
  if (authenticatedUserId !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized to view this membership' });
    return;
  }
  const membership = await membershipRepo.findMembershipByUserId(userId);

  if (!membership) {
    res.status(404).json({
      success: false,
      message: `No active membership found for user with ID ${userId}`,
    });
    return;
  }

  // For storefront, only return the membership if it's active
  if (!membership.isActive) {
    res.status(404).json({
      success: false,
      message: `No active membership found for user with ID ${userId}`,
    });
    return;
  }

  // Get tier details to include with membership
  const tier = await membershipRepo.findTierById(membership.tierId);

  res.status(200).json({
    success: true,
    data: {
      ...membership,
      tier,
    },
  });
};

export const getUserMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;
  const authenticatedUserId = req.user?.customerId || req.user?.id;
  if (authenticatedUserId !== userId) {
    res.status(403).json({ success: false, message: 'Not authorized to view these membership benefits' });
    return;
  }

  // First check if user has an active membership
  const membership = await membershipRepo.findMembershipByUserId(userId);
  if (!membership || !membership.isActive) {
    res.status(404).json({
      success: false,
      message: `No active membership found for user with ID ${userId}`,
    });
    return;
  }

  const benefits = await membershipRepo.getUserMembershipBenefits(userId);

  res.status(200).json({
    success: true,
    data: benefits,
  });
};
