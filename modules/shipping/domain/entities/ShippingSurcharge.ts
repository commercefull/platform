/**
 * Shipping Surcharge Domain Entity
 *
 * Represents a carrier surcharge (fuel, remote-area, residential, oversize,
 * signature, insurance) that is added to a shipping rate's base amount.
 * Conditions are evaluated via `libs/rules/conditions` (Epic A).
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic D.
 */

import { matchesConditions, type AttributeCondition, type ConditionContext } from '../../../../libs/rules/conditions';

export type SurchargeType = 'fuel' | 'remoteArea' | 'residential' | 'oversize' | 'signature' | 'insurance';
export type SurchargeCalculationType = 'flat' | 'percentage';

export interface ShippingSurchargeProps {
  shippingSurchargeId: string;
  shippingRateId: string;
  type: SurchargeType;
  calculationType: SurchargeCalculationType;
  value: number;
  conditions?: AttributeCondition[] | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurchargeContext extends ConditionContext {
  baseRateCents?: number;
  weight?: number;
  volume?: number;
  destinationZone?: string;
  orderValueCents?: number;
  isResidential?: boolean;
  isRemoteArea?: boolean;
  requiresSignature?: boolean;
  declaredValueCents?: number;
}

export class ShippingSurcharge {
  private props: ShippingSurchargeProps;

  constructor(props: ShippingSurchargeProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.shippingSurchargeId;
  }

  get type(): SurchargeType {
    return this.props.type;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Check if this surcharge's conditions match the given context.
   * Surcharges with no conditions always match.
   */
  isApplicable(context: SurchargeContext): boolean {
    if (!this.props.isActive) return false;
    if (!this.props.conditions || this.props.conditions.length === 0) return true;
    return matchesConditions(context, this.props.conditions);
  }

  /**
   * Calculate the surcharge amount to add to the base rate.
   * Returns 0 if the surcharge is not applicable.
   *
   * @param baseRateCents The base shipping rate in cents (before surcharges)
   * @param context  The shipping context (weight, destination, etc.)
   * @returns The surcharge amount to add
   */
  calculate(baseRateCents: number, context: SurchargeContext): number {
    if (!this.isApplicable(context)) return 0;

    switch (this.props.calculationType) {
      case 'flat':
        return this.props.value;

      case 'percentage':
        return Math.round((baseRateCents * this.props.value) / 100);

      default:
        return 0;
    }
  }

  toJSON(): ShippingSurchargeProps {
    return { ...this.props };
  }
}
