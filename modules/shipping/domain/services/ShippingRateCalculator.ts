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
import {
  ShippingSurcharge as ShippingSurchargeEntity,
  SurchargeContext,
  type SurchargeType,
  type SurchargeCalculationType,
} from '../../domain/entities/ShippingSurcharge';
import type { ShippingSurchargePort } from '../../domain/repositories/ShippingSurchargePort';
import type { ShippingRate, ShippingSurcharge } from '../../../../libs/db/types';
import type { AttributeCondition } from '../../../../libs/rules/conditions';

export interface ShippingCalculationInput {
  rate: ShippingRate;
  orderSubtotalCents: number;
  itemCount: number;
  totalWeight?: number;
  totalVolume?: number;
  destinationZone?: string;
  isResidential?: boolean;
  isRemoteArea?: boolean;
  requiresSignature?: boolean;
  declaredValueCents?: number;
}

export interface ShippingCalculationResult {
  baseAmountCents: number;
  surchargeAmountCents: number;
  totalAmountCents: number;
  surchargeBreakdown: Array<{ type: string; amountCents: number }>;
  isFreeShipping: boolean;
}

export class ShippingRateCalculator {
  constructor(private readonly surchargePort?: ShippingSurchargePort) {}

  /**
   * Calculate the full shipping amount for a rate, including surcharges.
   */
  async calculate(input: ShippingCalculationInput): Promise<ShippingCalculationResult> {
    // 1. Compute the base amount via the existing rate calculator
    const baseAmountCents = calculateRate(input.rate, input.orderSubtotalCents, input.itemCount, input.totalWeight);

    // 2. Check free shipping
    if (baseAmountCents === 0) {
      return {
        baseAmountCents: 0,
        surchargeAmountCents: 0,
        totalAmountCents: 0,
        surchargeBreakdown: [],
        isFreeShipping: true,
      };
    }

    // 3. Load and apply surcharges
    const rawSurcharges = this.surchargePort ? await this.surchargePort.findActiveByRateId(input.rate.shippingRateId) : [];
    const surchargeContext: SurchargeContext = {
      baseRateCents: baseAmountCents,
      weight: input.totalWeight,
      volume: input.totalVolume,
      destinationZone: input.destinationZone,
      orderValueCents: input.orderSubtotalCents,
      isResidential: input.isResidential,
      isRemoteArea: input.isRemoteArea,
      requiresSignature: input.requiresSignature,
      declaredValueCents: input.declaredValueCents,
    };

    let surchargeAmountCents = 0;
    const surchargeBreakdown: Array<{ type: string; amountCents: number }> = [];

    for (const raw of rawSurcharges) {
      const entity = this.toDomainEntity(raw);
      const amountCents = entity.calculate(baseAmountCents, surchargeContext);
      if (amountCents > 0) {
        surchargeAmountCents += amountCents;
        surchargeBreakdown.push({ type: raw.type, amountCents });
      }
    }

    const totalAmountCents = Math.max(0, baseAmountCents + surchargeAmountCents);

    return {
      baseAmountCents,
      surchargeAmountCents,
      totalAmountCents,
      surchargeBreakdown,
      isFreeShipping: false,
    };
  }

  private toDomainEntity(raw: ShippingSurcharge): ShippingSurchargeEntity {
    return new ShippingSurchargeEntity({
      shippingSurchargeId: raw.shippingSurchargeId,
      shippingRateId: raw.shippingRateId,
      type: raw.type as SurchargeType,
      calculationType: raw.calculationType as SurchargeCalculationType,
      value: parseFloat(raw.value),
      conditions: (raw.conditions as AttributeCondition[] | null) ?? null,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}

export const shippingRateCalculator = new ShippingRateCalculator();
