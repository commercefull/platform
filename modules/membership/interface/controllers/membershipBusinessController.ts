import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  manageUserMembershipsUseCase,
  manageMembershipTiersUseCase,
  manageTierBenefitsUseCase,
} from '../../application/wired';
import { LegacyMembershipBenefit as _MembershipBenefit } from '../../application/wired';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';

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
  const tiers = await manageMembershipTiersUseCase.findAllTiers(includeInactive);

  res.status(200).json({
    success: true,
    data: tiers,
  });
};

export const getMembershipTierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const tier = await manageMembershipTiersUseCase.findTierById(id);

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
  try {
    const tier = await manageMembershipTiersUseCase.create(req.body);

    res.status(201).json({
      success: true,
      data: tier,
      message: 'Membership tier created successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateMembershipTier = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateTierBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedTier = await manageMembershipTiersUseCase.update(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedTier,
      message: 'Membership tier updated successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const deleteMembershipTier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    await manageMembershipTiersUseCase.remove(id);

    res.status(200).json({
      success: true,
      message: 'Membership tier deleted successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

// Membership Benefit Endpoints
export const getMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { tierId } = req.query;

  let benefits;
  if (tierId) {
    benefits = await manageTierBenefitsUseCase.findBenefitsByTierId(tierId as string);
  } else {
    benefits = await manageTierBenefitsUseCase.findAllBenefits();
  }

  res.status(200).json({
    success: true,
    data: benefits,
  });
};

export const getMembershipBenefitById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const benefit = await manageTierBenefitsUseCase.findBenefitById(id);

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
  try {
    const benefit = await manageTierBenefitsUseCase.create(req.body);

    res.status(201).json({
      success: true,
      data: benefit,
      message: 'Membership benefit created successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateMembershipBenefit = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateBenefitBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedBenefit = await manageTierBenefitsUseCase.update(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedBenefit,
      message: 'Membership benefit updated successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const deleteMembershipBenefit = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    await manageTierBenefitsUseCase.remove(id);

    res.status(200).json({
      success: true,
      message: 'Membership benefit deleted successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

// User Membership Endpoints
export const getUserMemberships = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { tierId, active } = req.query;

  let memberships;
  const isActive = active === 'true';
  if (tierId) {
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0, { tierId: tierId as string, isActive: isActive });
  } else if (active) {
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0, { isActive });
  } else {
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0);
  }

  res.status(200).json({
    success: true,
    data: memberships,
  });
};

export const getUserMembershipById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const membership = await manageUserMembershipsUseCase.findUserMembershipById(id);

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
  const membership = await manageUserMembershipsUseCase.findMembershipByUserId(userId);

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
  try {
    const membership = await manageUserMembershipsUseCase.create(req.body);

    res.status(201).json({
      success: true,
      data: membership,
      message: 'User membership created successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateUserMembership = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateUserMembershipBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const updatedMembership = await manageUserMembershipsUseCase.update(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedMembership,
      message: 'User membership updated successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const cancelUserMembership = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    const cancelledMembership = await manageUserMembershipsUseCase.cancel(id);

    res.status(200).json({
      success: true,
      data: cancelledMembership,
      message: 'User membership cancelled successfully',
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const getUserMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;

  const benefits = await manageUserMembershipsUseCase.getUserMembershipBenefits(userId);

  res.status(200).json({
    success: true,
    data: benefits,
  });
};
