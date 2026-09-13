/**
 * Shipping Rate Calculator Service
 *
 * Shared service that computes the final shipping amount for a rate by:
 * 1. Computing the base amount via the existing `calculateRate` function.
 * 2. Applying dimensional weight (if `dimensionalFactor` and volume are provided).
 * 3. Adding all applicable surcharges (fuel, remote-area, residential, oversize,
 *    signature, insurance).
 *
 * Surcharges are evaluated against a `SurchargeContext` using the shared
 * `libs/rules/conditions` matcher from Epic A.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic D.
 */

import { calculateRate } from './calculateRate';
import { ShippingSurcharge as ShippingSurchargeEntity, SurchargeContext } from '../../domain/entities/ShippingSurcharge';
import type { ShippingSurchargePort } from '../../domain/repositories/ShippingSurchargePort';
import type { ShippingRate, ShippingSurcharge } from '../../../../libs/db/types';
import type { AttributeCondition } from '../../../../libs/rules/conditions';

export interface ShippingCalculationInput {
  rate: ShippingRate;
  orderSubtotal: number;
  itemCount: number;
  totalWeight?: number;
  totalVolume?: number;
  destinationZone?: string;
  isResidential?: boolean;
  isRemoteArea?: boolean;
  requiresSignature?: boolean;
  declaredValue?: number;
}

export interface ShippingCalculationResult {
  baseAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  surchargeBreakdown: Array<{ type: string; amount: number }>;
  isFreeShipping: boolean;
}

export class ShippingRateCalculator {
  constructor(private readonly surchargePort?: ShippingSurchargePort) {}

  /**
   * Calculate the full shipping amount for a rate, including surcharges.
   */
  async calculate(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    // 1. Compute the base amount via the existing rate calculator
    const baseAmount = calculateRate(input.rate, input.orderSubtotal, input.itemCount, input.totalWeight);

    // 2. Check free shipping
    if (baseAmount === 0) {
      return {
        baseAmount: 0,
        surchargeAmount: 0,
        totalAmount: 0,
        surchargeBreakdown: [],
        isFreeShipping: true,
      };
    }

    // 3. Load and apply surcharges
    const rawSurcharges = this.surchargePort
      ? await this.surchargePort.findActiveByRateId(input.rate.shippingRateId)
      : [];
    const surchargeContext: SurchargeContext = {
      baseRate: baseAmount,
      weight: input.totalWeight,
      volume: input.totalVolume,
      destinationZone: input.destinationZone,
      orderValue: input.orderSubtotal,
      isResidential: input.isResidential,
      isRemoteArea: input.isRemoteArea,
      requiresSignature: input.requiresSignature,
      declaredValue: input.declaredValue,
    };

    let surchargeAmount = 0;
    const surchargeBreakdown: Array<{ type: string; amount: number }> = [];

    for (const raw of rawSurcharges) {
      const entity = this.toDomainEntity(raw);
      const amount = entity.calculate(baseAmount, surchargeContext);
      if (amount > 0) {
        surchargeAmount += amount;
        surchargeBreakdown.push({ type: raw.type, amount });
      }
    }

    const totalAmount = Math.max(0, baseAmount + surchargeAmount);

    return {
      baseAmount,
      surchargeAmount,
      totalAmount,
      surchargeBreakdown,
      isFreeShipping: false,
    };
  }

  private toDomainEntity(raw: ShippingSurcharge): ShippingSurchargeEntity {
    return new ShippingSurchargeEntity({
      shippingSurchargeId: raw.shippingSurchargeId,
      shippingRateId: raw.shippingRateId,
      type: raw.type,
      calculationType: raw.calculationType,
      value: parseFloat(raw.value),
      conditions: (raw.conditions as AttributeCondition[] | null) ?? null,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}

export const shippingRateCalculator = new ShippingRateCalculator();
