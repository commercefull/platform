/**
 * Fraud Controller for Admin Hub
 * Manages fraud rules, blacklist entries, and fraud checks.
 * Epic F — condition-builder for FraudRule.conditions + risk-score simulator.
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { FraudScreeningService } from '../../application/services/FraudScreeningService';
import { FraudRepo as fraudRepo } from '../../infrastructure';
import { adminRespond } from '../../../../libs/adminRespond';

const fraudScreeningService = new FraudScreeningService();

// ============================================================================
// List Fraud Rules
// ============================================================================

export const listFraudRules = async (req: TypedRequest, res: Response): Promise<void> => {
  const rules = await fraudRepo.getRules(false);
  const pendingReviews = await fraudRepo.getPendingReviews();

  adminRespond(req, res, 'payment/fraud/rules', {
    pageName: 'Fraud Rules',
    rules,
    pendingReviews,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Create Fraud Rule
// ============================================================================

export const createFraudRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, ruleType, action, riskScore, conditions, isActive } = body;

    // Parse conditions from condition-builder form data
    const parsedConditions = parseConditionsFromForm(conditions);

    await fraudRepo.saveRule({
      fraudRuleId: '',
      name,
      description: description || undefined,
      ruleType: ruleType || 'custom',
      action: action || 'review',
      riskScore: parseInt(riskScore, 10) || 10,
      conditions: parsedConditions,
      isActive: isActive === 'true' || isActive === true,
    });

    res.redirect('/hub/payment/fraud/rules?success=Fraud rule created');
  } catch (error: unknown) {
    logger.warn('Error creating fraud rule:', error);
    res.redirect('/hub/payment/fraud/rules?error=' + encodeURIComponent((error as Error).message));
  }
};

// ============================================================================
// Update Fraud Rule
// ============================================================================

export const updateFraudRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fraudRuleId } = req.params;
    const body = req.body as RequestBody;
    const { name, description, ruleType, action, riskScore, conditions, isActive } = body;

    const existing = await fraudRepo.getRule(fraudRuleId);
    if (!existing) {
      res.redirect('/hub/payment/fraud/rules?error=Fraud rule not found');
      return;
    }

    const parsedConditions = parseConditionsFromForm(conditions);

    await fraudRepo.saveRule({
      ...existing,
      name,
      description: description || undefined,
      ruleType: ruleType || existing.ruleType,
      action: action || existing.action,
      riskScore: parseInt(riskScore, 10) || existing.riskScore,
      conditions: parsedConditions,
      isActive: isActive === 'true' || isActive === true,
    });

    res.redirect('/hub/payment/fraud/rules?success=Fraud rule updated');
  } catch (error: unknown) {
    logger.warn('Error updating fraud rule:', error);
    res.redirect('/hub/payment/fraud/rules?error=' + encodeURIComponent((error as Error).message));
  }
};

// ============================================================================
// Delete Fraud Rule
// ============================================================================

export const deleteFraudRule = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { fraudRuleId } = req.params;
    await fraudRepo.deleteRule(fraudRuleId);
    res.json({ success: true });
  } catch (error: unknown) {
    logger.warn('Error deleting fraud rule:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ============================================================================
// Risk Score Simulator
// ============================================================================

export const simulateFraudScreening = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { email, ipAddress, billingCountry, shippingCountry, orderAmount, currency, paymentMethod, isFirstOrder, isGuestCheckout } = body;

    const result = await fraudScreeningService.screen({
      email: email || undefined,
      ipAddress: ipAddress || undefined,
      billingCountry: billingCountry || undefined,
      shippingCountry: shippingCountry || undefined,
      orderAmount: parseFloat(orderAmount) || 0,
      currency: currency || 'USD',
      paymentMethod: paymentMethod || undefined,
      isFirstOrder: isFirstOrder === 'true',
      isGuestCheckout: isGuestCheckout === 'true',
    });

    res.json({
      success: true,
      decision: result.decision,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      triggeredRules: result.triggeredRules,
    });
  } catch (error: unknown) {
    logger.warn('Error simulating fraud screening:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ============================================================================
// Helper: Parse conditions from form data
// ============================================================================

function parseConditionsFromForm(conditions: unknown): Record<string, unknown> {
  if (!conditions || typeof conditions === 'string') {
    try {
      return conditions ? JSON.parse(conditions as string) : {};
    } catch {
      return {};
    }
  }
  // If conditions is an array of {attribute, operator, value} from the condition builder
  if (Array.isArray(conditions)) {
    const result: Record<string, unknown> = {};
    for (const cond of conditions) {
      if (cond && typeof cond === 'object') {
        const c = cond as { attribute?: string; operator?: string; value?: string };
        if (c.attribute && c.operator) {
          let value: unknown = c.value;
          // Try to parse numeric values
          if (value && typeof value === 'string' && !isNaN(Number(value))) {
            value = Number(value);
          }
          // Handle 'in' operator (comma-separated)
          if (c.operator === 'in' && typeof value === 'string') {
            value = value.split(',').map(v => v.trim());
          }
          result[c.attribute] = { operator: c.operator, value };
        }
      }
    }
    return result;
  }
  return conditions as Record<string, unknown>;
}
