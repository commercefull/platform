/**
 * Inventory Allocation Rule Domain Entity
 *
 * Represents a rule that governs how inventory is allocated across locations
 * and pools when fulfilling an order. Rules determine:
 * - Allocation strategy (fifo, lifo, nearest, even_split, priority)
 * - Reservation policy (immediate vs deferred)
 * - Backorder and oversell behavior
 * - Low-stock threshold
 * - Max allocation per order
 *
 * Rules are scoped to global, pool, product, or category level and evaluated
 * using the shared `libs/rules/conditions` matcher (Epic A).
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic J.
 */

import { matchesConditions, type AttributeCondition } from '../../../../libs/rules/conditions';

export type AllocationRuleScope = 'global' | 'pool' | 'product' | 'category';
export type AllocationStrategy = 'fifo' | 'lifo' | 'nearest' | 'even_split' | 'priority';
export type ReservationPolicy = 'immediate' | 'deferred';

export interface InventoryAllocationRuleProps {
  inventoryAllocationRuleId: string;
  name: string;
  description?: string;
  scope: AllocationRuleScope;
  poolId?: string;
  categoryId?: string;
  productId?: string;
  allocationStrategy: AllocationStrategy;
  reservationPolicy: ReservationPolicy;
  lowStockThreshold: number;
  oversellBuffer: number;
  allowBackorder: boolean;
  allowOversell: boolean;
  maxAllocationPerOrder: number;
  conditions?: AttributeCondition[] | null;
  priority: number;
  isActive: boolean;
}

export interface AllocationEvaluationContext {
  poolId?: string;
  categoryId?: string;
  productId?: string;
  orderQuantity?: number;
  availableStock?: number;
  customerLocation?: { latitude: number; longitude: number; postalCode?: string };
  isPreorder?: boolean;
}

export interface AllocationRuleEvaluationResult {
  applicableRule: InventoryAllocationRule | null;
  allocationStrategy: AllocationStrategy;
  reservationPolicy: ReservationPolicy;
  lowStockThreshold: number;
  oversellBuffer: number;
  allowBackorder: boolean;
  allowOversell: boolean;
  maxAllocationPerOrder: number;
  effectiveAvailable: number;
}

export class InventoryAllocationRule {
  private props: InventoryAllocationRuleProps;

  constructor(props: InventoryAllocationRuleProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.inventoryAllocationRuleId;
  }

  get scope(): AllocationRuleScope {
    return this.props.scope;
  }

  get priority(): number {
    return this.props.priority;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get allocationStrategy(): AllocationStrategy {
    return this.props.allocationStrategy;
  }

  get reservationPolicy(): ReservationPolicy {
    return this.props.reservationPolicy;
  }

  get lowStockThreshold(): number {
    return this.props.lowStockThreshold;
  }

  get oversellBuffer(): number {
    return this.props.oversellBuffer;
  }

  get allowBackorder(): boolean {
    return this.props.allowBackorder;
  }

  get allowOversell(): boolean {
    return this.props.allowOversell;
  }

  get maxAllocationPerOrder(): number {
    return this.props.maxAllocationPerOrder;
  }

  /**
   * Check if this rule applies to the given context.
   * Rules with no conditions always match.
   */
  isApplicable(context: AllocationEvaluationContext): boolean {
    if (!this.props.isActive) return false;

    // Check scope
    if (this.props.scope === 'pool' && this.props.poolId) {
      if (context.poolId !== this.props.poolId) return false;
    }
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

  toJSON(): InventoryAllocationRuleProps {
    return { ...this.props };
  }
}
