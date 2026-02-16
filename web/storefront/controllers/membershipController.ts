/**
 * Storefront Membership Controller
 * Customer-facing membership pages
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: List available membership plans
 */
export const listPlans = async (req: TypedRequest, res: Response) => {
  try {
    const plans = await query(
      `SELECT mp.*, COUNT(mb."membershipBenefitId") as "benefitCount"
       FROM "membershipPlan" mp
       LEFT JOIN "membershipBenefit" mb ON mp."membershipPlanId" = mb."membershipPlanId"
       WHERE mp."isActive" = true
       GROUP BY mp."membershipPlanId"
       ORDER BY mp."sortOrder", mp."price" ASC`,
      [],
    );

    storefrontRespond(req, res, 'membership/plans', {
      pageName: 'Membership Plans',
      plans,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load membership plans' });
  }
};

/**
 * GET: View membership plan detail
 */
export const viewPlan = async (req: TypedRequest, res: Response) => {
  try {
    const { planId } = req.params;

    const plan = await queryOne(
      `SELECT * FROM "membershipPlan" WHERE "membershipPlanId" = $1 AND "isActive" = true`,
      [planId],
    );

    if (!plan) {
      (req as any).flash?.('error', 'Membership plan not found');
      return res.redirect('/membership');
    }

    const benefits = await query(
      `SELECT * FROM "membershipBenefit" WHERE "membershipPlanId" = $1 ORDER BY "sortOrder"`,
      [planId],
    );

    storefrontRespond(req, res, 'membership/plan-detail', {
      pageName: (plan as any).name,
      plan,
      benefits,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load plan details' });
  }
};

/**
 * GET: My membership dashboard
 */
export const myMembership = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const membership = await queryOne(
      `SELECT m.*, mp."name" as "planName", mp."tier", mp."price", mp."currency"
       FROM "membership" m
       LEFT JOIN "membershipPlan" mp ON m."membershipPlanId" = mp."membershipPlanId"
       WHERE m."customerId" = $1 AND m."status" = 'active'
       ORDER BY m."createdAt" DESC LIMIT 1`,
      [customerId],
    );

    const benefits = membership
      ? await query(
          `SELECT * FROM "membershipBenefit" WHERE "membershipPlanId" = $1 ORDER BY "sortOrder"`,
          [(membership as any).membershipPlanId],
        )
      : [];

    storefrontRespond(req, res, 'membership/my-membership', {
      pageName: 'My Membership',
      membership,
      benefits,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load membership' });
  }
};

/**
 * POST: Join a membership plan
 */
export const joinPlan = async (req: TypedRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.redirect('/signin');

    const { planId } = req.params;

    const plan = await queryOne(
      `SELECT * FROM "membershipPlan" WHERE "membershipPlanId" = $1 AND "isActive" = true`,
      [planId],
    );

    if (!plan) {
      (req as any).flash?.('error', 'Membership plan not found');
      return res.redirect('/membership');
    }

    // Check if already a member
    const existing = await queryOne(
      `SELECT * FROM "membership" WHERE "customerId" = $1 AND "status" = 'active'`,
      [customerId],
    );

    if (existing) {
      (req as any).flash?.('error', 'You already have an active membership. Please cancel it first to switch plans.');
      return res.redirect('/membership/my');
    }

    await query(
      `INSERT INTO "membership" ("customerId", "membershipPlanId", "status", "startDate", "createdAt", "updatedAt")
       VALUES ($1, $2, 'active', NOW(), NOW(), NOW())`,
      [customerId, planId],
    );

    (req as any).flash?.('success', `Welcome! You've joined the ${(plan as any).name} plan.`);
    res.redirect('/membership/my');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to join membership plan');
    res.redirect('/membership');
  }
};
