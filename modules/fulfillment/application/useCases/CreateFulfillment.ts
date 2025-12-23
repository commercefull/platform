/**
 * CreateFulfillment Use Case
 *
 * Creates a new fulfillment for an order.
 */

import { Fulfillment, SourceType, Address } from '../../domain/entities/Fulfillment';
import { FulfillmentItem } from '../../domain/entities/FulfillmentItem';
import { IFulfillmentRepository } from '../../domain/repositories/FulfillmentRepository';
import { emitFulfillmentCreated } from '../../domain/events/FulfillmentEvents';

export interface CreateFulfillmentItemInput {
  orderItemId: string;
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  quantityOrdered: number;
  warehouseLocation?: string;
  binLocation?: string;
}

export interface CreateFulfillmentInput {
  orderId: string;
  orderNumber?: string;
  sourceType: SourceType;
  sourceId: string;
  merchantId?: string;
  supplierId?: string;
  storeId?: string;
  channelId?: string;
  shipFromAddress: Address;
  shipToAddress: Address;
  carrierId?: string;
  carrierName?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  fulfillmentPartnerId?: string;
  items: CreateFulfillmentItemInput[];
  notes?: string;
}

export interface CreateFulfillmentOutput {
  fulfillment: Fulfillment;
  items: FulfillmentItem[];
}

export class CreateFulfillmentUseCase {
  constructor(private fulfillmentRepository: IFulfillmentRepository) {}

  async execute(input: CreateFulfillmentInput): Promise<CreateFulfillmentOutput> {
    // Create the fulfillment
    const fulfillment = Fulfillment.create({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      merchantId: input.merchantId,
      supplierId: input.supplierId,
      storeId: input.storeId,
      channelId: input.channelId,
      shipFromAddress: input.shipFromAddress,
      shipToAddress: input.shipToAddress,
      carrierId: input.carrierId,
      carrierName: input.carrierName,
      shippingMethodId: input.shippingMethodId,
      shippingMethodName: input.shippingMethodName,
      fulfillmentPartnerId: input.fulfillmentPartnerId,
      notes: input.notes,
    });

    // Save the fulfillment
    const savedFulfillment = await this.fulfillmentRepository.save(fulfillment);

    // Create fulfillment items
    const items: FulfillmentItem[] = [];
    for (const itemInput of input.items) {
      const item = FulfillmentItem.create({
        fulfillmentId: savedFulfillment.fulfillmentId,
        orderItemId: itemInput.orderItemId,
        productId: itemInput.productId,
        variantId: itemInput.variantId,
        sku: itemInput.sku,
        name: itemInput.name,
        quantityOrdered: itemInput.quantityOrdered,
        quantityFulfilled: 0,
        warehouseLocation: itemInput.warehouseLocation,
        binLocation: itemInput.binLocation,
      });
      items.push(item);
    }

    // Save items
    const savedItems = await this.fulfillmentRepository.saveItems(items);

    // Emit event
    emitFulfillmentCreated({
      fulfillmentId: savedFulfillment.fulfillmentId,
      orderId: savedFulfillment.orderId,
      orderNumber: savedFulfillment.orderNumber,
      sourceType: savedFulfillment.sourceType,
      sourceId: savedFulfillment.sourceId,
    });

    return {
      fulfillment: savedFulfillment,
      items: savedItems,
    };
  }
}
