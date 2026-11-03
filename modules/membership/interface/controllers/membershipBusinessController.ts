import {jsonResponse} from 'libs/apiResponse';
import type {HttpRequest, HttpResponse} from 'libs/http';
import {manageUserMembershipsUseCase, manageMembershipTiersUseCase, manageTierBenefitsUseCase} from '../../application/wired';
import {LegacyMembershipBenefit as _MembershipBenefit} from '../../application/wired';

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

  jsonResponse(res, 200, {
    success: true,
    data: tiers,
  });
};

export const getMembershipTierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const tier = await manageMembershipTiersUseCase.findTierById(id);

  if (!tier) {
    jsonResponse(res, 404, {
      success: false,
      message: `Membership tier with ID ${req.params.id} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: tier,
  });
};

export const createMembershipTier = async (
  req: HttpRequest<Record<string, string>, unknown, CreateTierBody>,
  res: HttpResponse,
): Promise<void> => {
  const tier = await manageMembershipTiersUseCase.create(req.body);

  jsonResponse(res, 201, {
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

  const updatedTier = await manageMembershipTiersUseCase.update(id, req.body);

  jsonResponse(res, 200, {
    success: true,
    data: updatedTier,
    message: 'Membership tier updated successfully',
  });
};

export const deleteMembershipTier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  await manageMembershipTiersUseCase.remove(id);

  jsonResponse(res, 200, {
    success: true,
    message: 'Membership tier deleted successfully',
  });
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

  jsonResponse(res, 200, {
    success: true,
    data: benefits,
  });
};

export const getMembershipBenefitById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const benefit = await manageTierBenefitsUseCase.findBenefitById(id);

  if (!benefit) {
    jsonResponse(res, 404, {
      success: false,
      message: `Membership benefit with ID ${id} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: benefit,
  });
};

export const createMembershipBenefit = async (
  req: HttpRequest<Record<string, string>, unknown, CreateBenefitBody>,
  res: HttpResponse,
): Promise<void> => {
  const benefit = await manageTierBenefitsUseCase.create(req.body);

  jsonResponse(res, 201, {
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

  const updatedBenefit = await manageTierBenefitsUseCase.update(id, req.body);

  jsonResponse(res, 200, {
    success: true,
    data: updatedBenefit,
    message: 'Membership benefit updated successfully',
  });
};

export const deleteMembershipBenefit = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  await manageTierBenefitsUseCase.remove(id);

  jsonResponse(res, 200, {
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
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0, { tierId: tierId as string, isActive: isActive });
  } else if (active) {
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0, { isActive });
  } else {
    memberships = await manageMembershipTiersUseCase.findAllUserMemberships(50, 0);
  }

  jsonResponse(res, 200, {
    success: true,
    data: memberships,
  });
};

export const getUserMembershipById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const membership = await manageUserMembershipsUseCase.findUserMembershipById(id);

  if (!membership) {
    jsonResponse(res, 404, {
      success: false,
      message: `User membership with ID ${id} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: membership,
  });
};

export const getUserMembershipByUserId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;
  const membership = await manageUserMembershipsUseCase.findMembershipByUserId(userId);

  if (!membership) {
    jsonResponse(res, 404, {
      success: false,
      message: `User membership for user with ID ${userId} not found`,
    });
    return;
  }

  jsonResponse(res, 200, {
    success: true,
    data: membership,
  });
};

export const createUserMembership = async (
  req: HttpRequest<Record<string, string>, unknown, CreateUserMembershipBody>,
  res: HttpResponse,
): Promise<void> => {
  const membership = await manageUserMembershipsUseCase.create(req.body);

  jsonResponse(res, 201, {
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

  const updatedMembership = await manageUserMembershipsUseCase.update(id, req.body);

  jsonResponse(res, 200, {
    success: true,
    data: updatedMembership,
    message: 'User membership updated successfully',
  });
};

export const cancelUserMembership = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const cancelledMembership = await manageUserMembershipsUseCase.cancel(id);

  jsonResponse(res, 200, {
    success: true,
    data: cancelledMembership,
    message: 'User membership cancelled successfully',
  });
};

export const getUserMembershipBenefits = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { userId } = req.params;

  const benefits = await manageUserMembershipsUseCase.getUserMembershipBenefits(userId);

  jsonResponse(res, 200, {
    success: true,
    data: benefits,
  });
};
