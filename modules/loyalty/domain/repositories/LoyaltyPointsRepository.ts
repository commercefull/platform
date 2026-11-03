/**
 * Loyalty Points Repository Port
 *
 * Domain interface for customer points persistence and balance mutations.
 */

import type { LoyaltyPoints, LoyaltyTier } from '../entities/LoyaltyModel';

export interface AdjustCustomerPointsParams {
  customerId: string;
  pointsChange: number;
  action: string;
  description?: string;
  orderId?: string;
  referenceId?: string;
}

export interface LoyaltyPointsRepository {
  findCustomerPoints(customerId: string): Promise<LoyaltyPoints | null>;
  findCustomerPointsWithTier(customerId: string): Promise<{ points: LoyaltyPoints; tier: LoyaltyTier } | null>;
  initializeCustomerPoints(customerId: string, tierId: string): Promise<LoyaltyPoints>;
  adjustCustomerPoints(params: AdjustCustomerPointsParams): Promise<LoyaltyPoints>;
  checkAndUpdateTier(customerId: string, lifetimePoints: number): Promise<void>;
  setMemberPoints(loyaltyPointsId: string, currentPoints: number, lifetimePoints?: number): Promise<void>;
  processOrderPoints(customerId: string, orderId: string, orderAmount: number): Promise<LoyaltyPoints>;
}
