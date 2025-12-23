/**
 * ProcessPointsExpiration Use Case
 * 
 * Processes expiring loyalty points for all customers.
 * Typically run as a scheduled job.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ProcessPointsExpirationInput {
  programId?: string;
  dryRun?: boolean;
  notifyCustomers?: boolean;
}

export interface ExpirationResult {
  customerId: string;
  pointsExpired: number;
  newBalance: number;
  expirationDate: string;
}

export interface ProcessPointsExpirationOutput {
  processedCount: number;
  totalPointsExpired: number;
  results: ExpirationResult[];
  dryRun: boolean;
}

export class ProcessPointsExpirationUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: ProcessPointsExpirationInput): Promise<ProcessPointsExpirationOutput> {
    const { programId, dryRun = false, notifyCustomers = true } = input;

    // Get all points batches that are expiring
    const now = new Date();
    const expiringPoints = await this.loyaltyRepository.getExpiringPoints(programId, now);

    const results: ExpirationResult[] = [];
    let totalPointsExpired = 0;

    // Group by customer
    const customerExpirations = new Map<string, number>();
    for (const batch of expiringPoints) {
      const current = customerExpirations.get(batch.customerId) || 0;
      customerExpirations.set(batch.customerId, current + batch.points);
    }

    // Process each customer's expiring points
    for (const [customerId, pointsToExpire] of customerExpirations) {
      if (!dryRun) {
        // Get current balance
        const customer = await this.loyaltyRepository.getCustomerLoyalty(customerId, programId);
        if (!customer) continue;

        const newBalance = Math.max(0, customer.pointsBalance - pointsToExpire);

        // Update balance
        await this.loyaltyRepository.updatePointsBalance(customerId, newBalance);

        // Mark batches as expired
        await this.loyaltyRepository.markPointsAsExpired(customerId, now);

        // Record transaction
        await this.loyaltyRepository.createTransaction({
          customerId,
          type: 'expired',
          points: -pointsToExpire,
          balance: newBalance,
          description: 'Points expired',
          referenceType: 'expiration',
          referenceId: now.toISOString(),
        });

        // Emit event
        await eventBus.emit('loyalty.points_expired', {
          customerId,
          pointsExpired: pointsToExpire,
          newBalance,
        });

        // Send notification if enabled
        if (notifyCustomers) {
          await eventBus.emit('notification.sent', {
            recipientId: customerId,
            recipientType: 'customer',
            channel: 'email',
            type: 'points_expired',
            data: {
              pointsExpired: pointsToExpire,
              remainingBalance: newBalance,
            },
          });
        }

        results.push({
          customerId,
          pointsExpired: pointsToExpire,
          newBalance,
          expirationDate: now.toISOString(),
        });
      } else {
        // Dry run - just record what would happen
        const customer = await this.loyaltyRepository.getCustomerLoyalty(customerId, programId);
        const newBalance = customer ? Math.max(0, customer.pointsBalance - pointsToExpire) : 0;

        results.push({
          customerId,
          pointsExpired: pointsToExpire,
          newBalance,
          expirationDate: now.toISOString(),
        });
      }

      totalPointsExpired += pointsToExpire;
    }

    return {
      processedCount: results.length,
      totalPointsExpired,
      results,
      dryRun,
    };
  }
}
