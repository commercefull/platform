/**
 * Return Rule Domain Entity
 *
 * Represents a return policy rule that determines:
 * - Return window (days from order date)
 * - Restocking fee (percentage or flat)
 * - Return shipping cost
 * - Auto-approve vs manual review
 * - Whether inspection is required
 * - Refund method (original, store credit, either)
 *
 * Rules are scoped to global, category, or product level and evaluated
 * using the shared `libs/rules/conditions` matcher (Epic A).
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic I.
 */

import { matchesConditions, type AttributeCondition } from '../../../../libs/rules/conditions';

export type ReturnRuleScope = 'global' | 'category' | 'product';
export type RefundMethod = 'original' | 'storeCredit' | 'either';

export interface ReturnRuleProps {
  returnRuleId: string;
  name: string;
  description?: string;
  scope: ReturnRuleScope;
  categoryId?: string;
  productId?: string;
  returnWindowDays?: number;
  restockingFeePercent?: number;
  restockingFeeFlat?: number;
  returnShippingCost?: number;
  customerPaysReturnShipping: boolean;
  autoApprove: boolean;
  requiresManualReview: boolean;
  requiresInspection: boolean;
  refundMethod: RefundMethod;
  conditions?: AttributeCondition[] | null;
  priority: number;
  isActive: boolean;
}

export interface ReturnEvaluationContext {
  orderDate: Date;
  returnDate?: Date;
  categoryId?: string;
  productId?: string;
  orderTotal?: number;
  itemCondition?: string;
  returnType?: string;
  customerOrdersCount?: number;
}

export interface ReturnRuleEvaluationResult {
  applicableRule: ReturnRule | null;
  isWithinWindow: boolean;
  daysSinceOrder: number;
  restockingFeePercent: number;
  restockingFeeFlat: number;
  returnShippingCost: number;
  customerPaysReturnShipping: boolean;
  autoApprove: boolean;
  requiresManualReview: boolean;
  requiresInspection: boolean;
  refundMethod: RefundMethod;
}

export class ReturnRule {
  private props: ReturnRuleProps;

  constructor(props: ReturnRuleProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.returnRuleId;
  }

  get scope(): ReturnRuleScope {
    return this.props.scope;
  }

  get priority(): number {
    return this.props.priority;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get returnWindowDays(): number | undefined {
    return this.props.returnWindowDays;
  }

  get restockingFeePercent(): number {
    return this.props.restockingFeePercent ?? 0;
  }

  get restockingFeeFlat(): number {
    return this.props.restockingFeeFlat ?? 0;
  }

  get returnShippingCost(): number {
    return this.props.returnShippingCost ?? 0;
  }

  get customerPaysReturnShipping(): boolean {
    return this.props.customerPaysReturnShipping;
  }

  get autoApprove(): boolean {
    return this.props.autoApprove;
  }

  get requiresManualReview(): boolean {
    return this.props.requiresManualReview;
  }

  get requiresInspection(): boolean {
    return this.props.requiresInspection;
  }

  get refundMethod(): RefundMethod {
    return this.props.refundMethod;
  }

  /**
   * Check if this rule applies to the given context.
   * Rules with no conditions always match.
   */
  isApplicable(context: ReturnEvaluationContext): boolean {
    if (!this.props.isActive) return false;

    // Check scope
    if (this.props.scope === 'category' && this.props.categoryId) {
      if (context.categoryId !== this.props.categoryId) return false;
    }
    if (this.props.scope === 'product' && this.props.productId) {
      if (context.productId !== this.props.productId) return false;
    }

    // Check conditions
    if (this.props.conditions && this.props.conditions.length > 0) {
      return matchesConditions(context as unknown as Record<string, unknown>, this.props.conditions);
    }

    return true;
  }

  /**
   * Check if the return is within the allowed window.
   */
  isWithinWindow(context: ReturnEvaluationContext): boolean {
    if (!this.props.returnWindowDays) return true;
    const returnDate = context.returnDate ?? new Date();
    const daysSinceOrder = Math.floor((returnDate.getTime() - context.orderDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceOrder <= this.props.returnWindowDays;
  }

  toJSON(): ReturnRuleProps {
    return { ...this.props };
  }
}
