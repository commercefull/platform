/**
 * Update Fulfillment Status Use Case
 * Handles status transitions for order fulfillments with validation and events
 */
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';
import { 
  FulfillmentShipped,
  FulfillmentDelivered,
  FulfillmentFailed,
  FulfillmentCancelled,
  eventDispatcher 
} from '../../domain/events/FulfillmentEvents';

export type FulfillmentStatusAction = 
  | 'start_processing'
  | 'start_picking'
  | 'complete_picking'
  | 'complete_packing'
  | 'ship'
  | 'in_transit'
  | 'out_for_delivery'
  | 'deliver'
  | 'fail'
  | 'return'
  | 'cancel';

// Valid status transitions
const VALID_TRANSITIONS: Record<string, FulfillmentStatusAction[]> = {
  pending: ['start_processing', 'cancel'],
  processing: ['start_picking', 'cancel'],
  picking: ['complete_picking', 'cancel'],
  packing: ['complete_packing', 'cancel'],
  ready_to_ship: ['ship', 'cancel'],
  shipped: ['in_transit', 'deliver', 'fail', 'return'],
  in_transit: ['out_for_delivery', 'deliver', 'fail', 'return'],
  out_for_delivery: ['deliver', 'fail', 'return'],
  delivered: ['return'],
  failed: ['start_processing', 'cancel', 'return'],
  returned: [],
  cancelled: []
};

export interface UpdateFulfillmentStatusInput {
  fulfillmentId: string;
  action: FulfillmentStatusAction;
  trackingNumber?: string;
  trackingUrl?: string;
  location?: string;
  reason?: string;
  performedBy?: string;
  packageWeight?: number;
  packageCount?: number;
}

export interface UpdateFulfillmentStatusOutput {
  success: boolean;
  fulfillment?: {
    id: string;
    orderId: string;
    previousStatus: string;
    newStatus: string;
    trackingNumber?: string;
  };
  error?: string;
}

export class UpdateFulfillmentStatus {
  async execute(input: UpdateFulfillmentStatusInput): Promise<UpdateFulfillmentStatusOutput> {
    try {
      // 1. Get current fulfillment
      const fulfillment = await fulfillmentRepo.findOrderFulfillmentById(input.fulfillmentId);
      if (!fulfillment) {
        return { success: false, error: 'Fulfillment not found' };
      }

      // 2. Validate transition
      const allowedActions = VALID_TRANSITIONS[fulfillment.status] || [];
      if (!allowedActions.includes(input.action)) {
        return { 
          success: false, 
          error: `Cannot perform '${input.action}' from status '${fulfillment.status}'` 
        };
      }

      // 3. Determine new status and prepare update data
      const { newStatus, updateData } = this.prepareStatusUpdate(fulfillment, input);

      // 4. Update fulfillment status
      await fulfillmentRepo.updateOrderFulfillmentStatus(
        input.fulfillmentId,
        newStatus as fulfillmentRepo.FulfillmentStatus,
        input.reason
      );

      // Apply additional updates if needed
      if (Object.keys(updateData).length > 0) {
        await fulfillmentRepo.updateOrderFulfillment(input.fulfillmentId, updateData);
      }

      // 5. Dispatch appropriate event
      await this.dispatchEvent(input.action, fulfillment, input);

      return {
        success: true,
        fulfillment: {
          id: input.fulfillmentId,
          orderId: fulfillment.orderId,
          previousStatus: fulfillment.status,
          newStatus,
          trackingNumber: input.trackingNumber || fulfillment.trackingNumber || undefined
        }
      };
    } catch (error) {
      console.error('UpdateFulfillmentStatus error:', error);
      return { success: false, error: 'Failed to update fulfillment status' };
    }
  }

  private prepareStatusUpdate(
    fulfillment: any,
    input: UpdateFulfillmentStatusInput
  ): { newStatus: string; updateData: Record<string, any> } {
    const updateData: Record<string, any> = {};

    switch (input.action) {
      case 'start_processing':
        return { newStatus: 'processing', updateData };

      case 'start_picking':
        return { newStatus: 'picking', updateData };

      case 'complete_picking':
        return { newStatus: 'packing', updateData };

      case 'complete_packing':
        if (input.packageWeight) updateData.packageWeight = input.packageWeight;
        if (input.packageCount) updateData.packageCount = input.packageCount;
        return { newStatus: 'ready_to_ship', updateData };

      case 'ship':
        if (!input.trackingNumber) {
          throw new Error('Tracking number is required for shipping');
        }
        updateData.trackingNumber = input.trackingNumber;
        updateData.trackingUrl = input.trackingUrl;
        updateData.shippedAt = new Date();
        return { newStatus: 'shipped', updateData };

      case 'in_transit':
        return { newStatus: 'in_transit', updateData };

      case 'out_for_delivery':
        return { newStatus: 'out_for_delivery', updateData };

      case 'deliver':
        updateData.deliveredAt = new Date();
        return { newStatus: 'delivered', updateData };

      case 'fail':
        updateData.statusReason = input.reason;
        return { newStatus: 'failed', updateData };

      case 'return':
        updateData.statusReason = input.reason;
        return { newStatus: 'returned', updateData };

      case 'cancel':
        updateData.statusReason = input.reason;
        return { newStatus: 'cancelled', updateData };

      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  private async dispatchEvent(
    action: FulfillmentStatusAction,
    fulfillment: any,
    input: UpdateFulfillmentStatusInput
  ): Promise<void> {
    const fulfillmentId = input.fulfillmentId;
    const orderId = fulfillment.orderId;

    switch (action) {
      case 'ship':
        await eventDispatcher.dispatch(
          FulfillmentShipped(fulfillmentId, orderId, input.trackingNumber!, fulfillment.distributionShippingCarrierId)
        );
        break;

      case 'deliver':
        await eventDispatcher.dispatch(FulfillmentDelivered(fulfillmentId, orderId, new Date()));
        break;

      case 'fail':
        await eventDispatcher.dispatch(FulfillmentFailed(fulfillmentId, input.reason || 'Unknown'));
        break;

      case 'cancel':
        await eventDispatcher.dispatch(FulfillmentCancelled(fulfillmentId, orderId, input.reason));
        break;
    }
  }
}

export const updateFulfillmentStatus = new UpdateFulfillmentStatus();
