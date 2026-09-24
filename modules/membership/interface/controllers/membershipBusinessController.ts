import type { HttpRequest, HttpResponse } from 'libs/http';
import { membershipSubscriptionDataRepository } from '../../application/wired';
import { LegacyMembershipBenefit as _MembershipBenefit } from '../../application/wired';

const membershipRepo = membershipSubscriptionDataRepository.memberships;

// Request body interfaces
interface CreateTierBody {
  name: string;
  description?: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  level: number;
  isActive?: boolean;
}

interface UpdateTierBody {
  name?: string;
  description?: string;
  monthlyPriceCents?: number;
  annualPriceCents?: number;
  level?: number;
  isActive?: boolean;
}

interface CreateBenefitBody {
  name: string;
  description?: string;
  tierIds: string[];
  benefitType: string;
  discountPercentage?: number;
  discountAmountCents?: number;
  isActive?: boolean;
}

interface UpdateBenefitBody {
  name?: string;
  description?: string;
  tierIds?: string[];
  benefitType?: string;
  discountPercentage?: number;
  discountAmountCents?: number;
  isActive?: boolean;
}

interface CreateUserMembershipBody {
  userId: string;
  tierId: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  membershipType?: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
}

interface UpdateUserMembershipBody {
  tierId?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  membershipType?: 'monthly' | 'annual' | 'lifetime';
  lastRenewalDate?: string;
  nextRenewalDate?: string;
  paymentMethod?: string;
}

// Membership Tier Endpoints
export const getMembershipTiers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const includeInactive = req.query.includeInactive === 'true';
  const tiers = await membershipRepo.findAllTiers(includeInactive);

  res.status(200).json({
    success: true,
    data: tiers,
  });
};

export const getMembershipTierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const tier = await membershipRepo.findTierById(id);

  if (!tier) {
    res.status(404).json({
      success: false,
      message: `Membership tier with ID ${req.params.id} not found`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: tier,
  });
};

export const createMembershipTier = async (
  req: HttpRequest<Record<string, string>, unknown, CreateTierBody>,
  res: HttpResponse,
): Promise<void> => {
  const { name, description, monthlyPriceCents, annualPriceCents, level, isActive = true } = req.body;

  // Basic validation
  if (!name || typeof monthlyPriceCents !== 'number' || typeof annualPriceCents !== 'number' || typeof level !== 'number') {
    res.status(400).json({
      success: false,
      message: 'Name, monthlyPriceCents, annualPriceCents, and level are required',
    });
    return;
  }

  const tier = await membershipRepo.createTier({
    name,
    description: description || '',
    monthlyPriceCents,
    annualPriceCents,
    level,
    isActive,
  });

  res.status(201).json({
    success: true,
    data: tier,
    message: 'Membership tier created successfully',
  });
};

export const updateMembershipTier = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateTierBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { name, description, monthlyPriceCents, annualPriceCents, level, isActive } = req.body;

  // Check if tier exists
  const existingTier = await membershipRepo.findTierById(id);
  if (!existingTier) {
    res.status(404).json({
      success: false,
      message: `Membership tier with ID ${req.params.id} not found`,
    });
    return;
  }

  const updatedTier = await membershipRepo.updateTier(id, {
    name,
    description,
    monthlyPriceCents,
    annualPriceCents,
    level,
    isActive,
  });

  res.status(200).json({
    success: true,
    data: updatedTier,
    message: 'Membership tier updated successfully',
  });
};

export const deleteMembershipTier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if tier exists
  const existingTier = await membershipRepo.findTierById(id);
  if (!existingTier) {
    res.status(404).json({
      success: false,
      message: `Membership tier with ID ${req.params.id} not found`,
    });
    return;
  }

  // Check if there are active memberships using this tier
  const activeMembers = await membershipRepo.findAllUserMemberships(50, 0, { tierId: id, isActive: true });
  if (activeMembers && activeMembers.length > 0) {
    res.status(400).json({
      success: false,
      message: `Cannot delete tier: ${activeMembers.length} active user memberships are using this tier`,
    });
    return;
  }

  await membershipRepo.deleteTier(id);

  res.status(200).json({
    success: true,
    message: 'Membership tier deleted successfully',
  });
};

// Membership Benefit Endpoints
export const getMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { tierId } = req.query;

  let benefits;
  if (tierId) {
    benefits = await membershipRepo.findBenefitsByTierId(tierId as string);
  } else {
    benefits = await membershipRepo.findAllBenefits();
  }

  res.status(200).json({
    success: true,
    data: benefits,
  });
};

export const getMembershipBenefitById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const benefit = await membershipRepo.findBenefitById(id);

  if (!benefit) {
    res.status(404).json({
      success: false,
      message: `Membership benefit with ID ${id} not found`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: benefit,
  });
};

export const createMembershipBenefit = async (
  req: HttpRequest<Record<string, string>, unknown, CreateBenefitBody>,
  res: HttpResponse,
): Promise<void> => {
  const { name, description, tierIds, benefitType, discountPercentage, discountAmountCents, isActive = true } = req.body;

  const tierId = tierIds[0];

  // Basic validation
  if (!name || !tierId || !benefitType) {
    res.status(400).json({
      success: false,
      message: 'Name, tierId, and benefitType are required',
    });
    return;
  }

  // Check if tier exists
  const tier = await membershipRepo.findTierById(tierId);
  if (!tier) {
    res.status(404).json({
      success: false,
      message: `Membership tier with ID ${tierId} not found`,
    });
    return;
  }

  const benefit = await membershipRepo.createBenefit({
    name,
    description,
    tierIds: [tierId],
    benefitType,
    discountPercentage,
    discountAmountCents,
    isActive,
  });

  res.status(201).json({
    success: true,
    data: benefit,
    message: 'Membership benefit created successfully',
  });
};

export const updateMembershipBenefit = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateBenefitBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { name, description, tierIds, benefitType, discountPercentage, discountAmountCents, isActive } = req.body;

  const tierId = tierIds ? tierIds[0] : undefined;

  // Check if benefit exists
  const existingBenefit = await membershipRepo.findBenefitById(id);
  if (!existingBenefit) {
    res.status(404).json({
      success: false,
      message: `Membership benefit with ID ${id} not found`,
    });
    return;
  }

  // If tier ID is changing, verify that the new tier exists
  if (tierId && !existingBenefit.tierIds.includes(tierId)) {
    const tier = await membershipRepo.findTierById(tierId);
    if (!tier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${tierId} not found`,
      });
      return;
    }
  }

  const updatedBenefit = await membershipRepo.updateBenefit(id, {
    name,
    description,
    tierIds: tierId ? [tierId] : undefined,
    benefitType,
    discountPercentage,
    discountAmountCents,
    isActive,
  });

  res.status(200).json({
    success: true,
    data: updatedBenefit,
    message: 'Membership benefit updated successfully',
  });
};

export const deleteMembershipBenefit = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if benefit exists
  const existingBenefit = await membershipRepo.findBenefitById(id);
  if (!existingBenefit) {
    res.status(404).json({
      success: false,
      message: `Membership benefit with ID ${id} not found`,
    });
    return;
  }

  await membershipRepo.deleteBenefit(id);

  res.status(200).json({
    success: true,
    message: 'Membership benefit deleted successfully',
  });
};

// User Membership Endpoints
export const getUserMemberships = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { tierId, active } = req.query;

  let memberships;
  const isActive = active === 'true';
  if (tierId) {
    memberships = await membershipRepo.findAllUserMemberships(50, 0, { tierId: tierId as string, isActive: isActive });
  } else if (active) {
    memberships = await membershipRepo.findAllUserMemberships(50, 0, { isActive });
  } else {
    memberships = await membershipRepo.findAllUserMemberships(50, 0);
  }

  res.status(200).json({
    success: true,
    data: memberships,
  });
};

export const getUserMembershipById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const membership = await membershipRepo.findUserMembershipById(id);

  if (!membership) {
    res.status(404).json({
      success: false,
      message: `User membership with ID ${id} not found`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: membership,
  });
};

export const getUserMembershipByUserId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;
  const membership = await membershipRepo.findMembershipByUserId(userId);

  if (!membership) {
    res.status(404).json({
      success: false,
      message: `User membership for user with ID ${userId} not found`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: membership,
  });
};

export const createUserMembership = async (
  req: HttpRequest<Record<string, string>, unknown, CreateUserMembershipBody>,
  res: HttpResponse,
): Promise<void> => {
  const {
    userId,
    tierId,
    startDate = new Date().toISOString(),
    endDate,
    isActive = true,
    autoRenew = false,
    membershipType = 'monthly',
    lastRenewalDate,
    nextRenewalDate,
    paymentMethod,
  } = req.body;

  // Basic validation
  if (!userId || !tierId) {
    res.status(400).json({
      success: false,
      message: 'User ID and Tier ID are required',
    });
    return;
  }

  // Check if user already has an active membership
  const existingMembership = await membershipRepo.findMembershipByUserId(userId);
  if (existingMembership && existingMembership.isActive) {
    res.status(400).json({
      success: false,
      message: `User with ID ${userId} already has an active membership`,
    });
    return;
  }

  // Check if tier exists
  const tier = await membershipRepo.findTierById(tierId);
  if (!tier) {
    res.status(404).json({
      success: false,
      message: `Membership tier with ID ${tierId} not found`,
    });
    return;
  }

  const membership = await membershipRepo.createUserMembership({
    userId,
    tierId,
    startDate,
    endDate: endDate || '',
    isActive,
    autoRenew,
    membershipType,
    lastRenewalDate,
    nextRenewalDate,
    paymentMethod,
  });

  res.status(201).json({
    success: true,
    data: membership,
    message: 'User membership created successfully',
  });
};

export const updateUserMembership = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateUserMembershipBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const { tierId, startDate, endDate, isActive, autoRenew, membershipType, lastRenewalDate, nextRenewalDate, paymentMethod } = req.body;

  // Check if membership exists
  const existingMembership = await membershipRepo.findUserMembershipById(id);
  if (!existingMembership) {
    res.status(404).json({
      success: false,
      message: `User membership with ID ${id} not found`,
    });
    return;
  }

  // If tier is being updated, verify that the new tier exists
  if (tierId && tierId !== existingMembership.tierId) {
    const tier = await membershipRepo.findTierById(tierId);
    if (!tier) {
      res.status(404).json({
        success: false,
        message: `Membership tier with ID ${tierId} not found`,
      });
      return;
    }
  }

  const updatedMembership = await membershipRepo.updateUserMembership(id, {
    tierId,
    startDate,
    endDate,
    isActive,
    autoRenew,
    membershipType,
    lastRenewalDate,
    nextRenewalDate,
    paymentMethod,
  });

  res.status(200).json({
    success: true,
    data: updatedMembership,
    message: 'User membership updated successfully',
  });
};

export const cancelUserMembership = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  // Check if membership exists
  const existingMembership = await membershipRepo.findUserMembershipById(id);
  if (!existingMembership) {
    res.status(404).json({
      success: false,
      message: `User membership with ID ${id} not found`,
    });
    return;
  }

  const cancelledMembership = await membershipRepo.cancelUserMembership(id);

  res.status(200).json({
    success: true,
    data: cancelledMembership,
    message: 'User membership cancelled successfully',
  });
};

export const getUserMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;

  const benefits = await membershipRepo.getUserMembershipBenefits(userId);

  res.status(200).json({
    success: true,
    data: benefits,
  });
};
