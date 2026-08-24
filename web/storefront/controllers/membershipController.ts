/**
 * Storefront Membership Controller
 * Customer-facing membership pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontMembershipUseCase } from '../../../modules/membership/application/useCases/ManageMembershipPrograms';

const manageStorefrontMembershipUseCase = new ManageStorefrontMembershipUseCase();

/**
 * GET: List available membership plans
 */
export const listPlans = async (req: TypedRequest, res: Response) => {
  const plans = await manageStorefrontMembershipUseCase.findActivePlansWithBenefitCount();

  storefrontRespond(req, res, 'membership/plans', {
    pageName: 'Membership Plans',
    plans,
  });
  
};

/**
 * GET: View membership plan detail
 */
export const viewPlan = async (req: TypedRequest, res: Response) => {
  const { planId } = req.params;

  const plan = await manageStorefrontMembershipUseCase.findPlanById(planId);

  if (!plan) {
    req.flash?.('error', 'Membership plan not found');
    return res.redirect('/membership');
  }

  const benefits = await manageStorefrontMembershipUseCase.findBenefitsByPlanId(planId);

  storefrontRespond(req, res, 'membership/plan-detail', {
    pageName: (plan as Record<string, unknown>).name as string,
    plan,
    benefits,
  });
  
};

/**
 * GET: My membership dashboard
 */
export const myMembership = async (req: TypedRequest, res: Response) => {
  const customerId = req.user?.customerId;
  if (!customerId) return res.redirect('/signin');

  const membership = await manageStorefrontMembershipUseCase.findActiveMembershipWithPlan(customerId);

  const benefits = membership
    ? await manageStorefrontMembershipUseCase.findBenefitsByPlanId((membership as Record<string, unknown>).membershipPlanId as string)
    : [];

  storefrontRespond(req, res, 'membership/my-membership', {
    pageName: 'My Membership',
    membership,
    benefits,
  });
  
};

/**
 * POST: Join a membership plan
 */
export const joinPlan = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { planId } = req.params;

    const plan = await manageStorefrontMembershipUseCase.findPlanById(planId);

    if (!plan) {
      req.flash?.('error', 'Membership plan not found');
      return res.redirect('/membership');
    }

    const existing = await manageStorefrontMembershipUseCase.findActiveMembershipByCustomerId(customerId);

    if (existing) {
      req.flash?.('error', 'You already have an active membership. Please cancel it first to switch plans.');
      return res.redirect('/membership/my');
    }

    await manageStorefrontMembershipUseCase.createMembership(customerId, planId);

    req.flash?.('success', `Welcome! You've joined the ${(plan as Record<string, unknown>).name} plan.`);
    res.redirect('/membership/my');
  } catch (error) {
    logger.warn('Error:', error);
    req.flash?.('error', 'Failed to join membership plan');
    res.redirect('/membership');
  }
};
