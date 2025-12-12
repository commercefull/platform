/**
 * Create Order Fulfillment Use Case
 * Creates a new order fulfillment record with warehouse assignment
 */
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';
import * as warehouseRepo from '../../repos/warehouseRepo';
import * as shippingRepo from '../../repos/shippingRepo';
import { eventDispatcher, FulfillmentCreated } from '../../domain/events/FulfillmentEvents';
import { findBestWarehouse } from '../warehouse/FindBestWarehouse';

export interface CreateOrderFulfillmentInput {
  orderId: string;
  orderNumber?: string;
  warehouseId?: string;
  shippingMethodId?: string;
  shipToAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  estimatedDeliveryAt?: Date;
  customerNotes?: string;
  createdBy?: string;
}

export interface CreateOrderFulfillmentOutput {
  success: boolean;
  fulfillment?: {
    id: string;
    orderId: string;
    warehouseId: string;
    warehouseName: string;
    status: string;
    trackingNumber?: string;
  };
  error?: string;
}

export class CreateOrderFulfillment {
  async execute(input: CreateOrderFulfillmentInput): Promise<CreateOrderFulfillmentOutput> {
    try {
      // 1. Validate shipping method if provided
      if (input.shippingMethodId) {
        const method = await shippingRepo.findShippingMethodById(input.shippingMethodId);
        if (!method) {
          return { success: false, error: 'Shipping method not found' };
        }
        if (!method.isActive) {
          return { success: false, error: 'Shipping method is not active' };
        }
      }

      // 2. Determine warehouse
      let warehouseId = input.warehouseId;
      let warehouseName = '';

      if (!warehouseId) {
        // Auto-assign warehouse using FindBestWarehouse use case
        const warehouseResult = await findBestWarehouse.execute({
          destinationCountry: input.shipToAddress.country,
          destinationState: input.shipToAddress.state,
          destinationPostalCode: input.shipToAddress.postalCode,
          destinationLatitude: input.shipToAddress.latitude,
          destinationLongitude: input.shipToAddress.longitude,
          shippingMethodId: input.shippingMethodId
        });

        if (!warehouseResult.success || !warehouseResult.warehouse) {
          return { success: false, error: warehouseResult.error || 'No warehouse available for fulfillment' };
        }

        warehouseId = warehouseResult.warehouse.id;
        warehouseName = warehouseResult.warehouse.name;
      } else {
        // Validate provided warehouse
        const warehouse = await warehouseRepo.findWarehouseById(warehouseId);
        if (!warehouse) {
          return { success: false, error: 'Warehouse not found' };
        }
        if (!warehouse.isActive || !warehouse.isFulfillmentCenter) {
          return { success: false, error: 'Warehouse is not available for fulfillment' };
        }
        warehouseName = warehouse.name;
      }

      // 3. Create fulfillment record
      const fulfillment = await fulfillmentRepo.createOrderFulfillment({
        orderId: input.orderId,
        orderNumber: input.orderNumber ?? null,
        distributionWarehouseId: warehouseId,
        distributionShippingMethodId: input.shippingMethodId ?? null,
        status: 'pending',
        shipToAddressLine1: input.shipToAddress.line1,
        shipToAddressLine2: input.shipToAddress.line2 ?? null,
        shipToCity: input.shipToAddress.city,
        shipToState: input.shipToAddress.state ?? null,
        shipToPostalCode: input.shipToAddress.postalCode,
        shipToCountry: input.shipToAddress.country,
        estimatedDeliveryAt: input.estimatedDeliveryAt ?? null,
        customerNotes: input.customerNotes ?? null,
        createdBy: input.createdBy ?? null
      });

      if (!fulfillment) {
        return { success: false, error: 'Failed to create fulfillment record' };
      }

      // 4. Dispatch event
      await eventDispatcher.dispatch(
        FulfillmentCreated(fulfillment.distributionOrderFulfillmentId, input.orderId, warehouseId)
      );

      return {
        success: true,
        fulfillment: {
          id: fulfillment.distributionOrderFulfillmentId,
          orderId: fulfillment.orderId,
          warehouseId: warehouseId!, // Guaranteed to be set by this point
          warehouseName,
          status: fulfillment.status
        }
      };
    } catch (error) {
      console.error('CreateOrderFulfillment error:', error);
      return { success: false, error: 'Failed to create order fulfillment' };
    }
  }
}

export const createOrderFulfillment = new CreateOrderFulfillment();
