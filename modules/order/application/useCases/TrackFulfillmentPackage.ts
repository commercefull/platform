/**
 * TrackFulfillmentPackage Use Case
 * Creates or updates package tracking on a fulfillment
 *
 * Validates: Requirements 2.11
 */

import orderFulfillmentPackageRepo, {
  OrderFulfillmentPackage,
  OrderFulfillmentPackageCreateParams,
} from '../../infrastructure/repositories/orderFulfillmentPackageRepo';

// ============================================================================
// Command
// ============================================================================

export class TrackFulfillmentPackageCommand {
  constructor(
    public readonly orderFulfillmentId: string,
    public readonly packageNumber: string,
    public readonly trackingNumber?: string,
    public readonly shippingLabelUrl?: string,
    public readonly commercialInvoiceUrl?: string,
    public readonly weight?: number,
    public readonly dimensions?: Record<string, any>,
    public readonly packageType?: string,
    public readonly customsInfo?: Record<string, any>,
    /** If provided, updates an existing package instead of creating a new one */
    public readonly orderFulfillmentPackageId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface TrackFulfillmentPackageResponse {
  orderFulfillmentPackageId: string;
  orderFulfillmentId: string;
  packageNumber: string;
  trackingNumber?: string;
  shippingLabelUrl?: string;
  commercialInvoiceUrl?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  packageType?: string;
  customsInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class TrackFulfillmentPackageUseCase {
  constructor(private readonly packageRepo: typeof orderFulfillmentPackageRepo = orderFulfillmentPackageRepo) {}

  async execute(command: TrackFulfillmentPackageCommand): Promise<TrackFulfillmentPackageResponse> {
    let pkg: OrderFulfillmentPackage | null = null;

    if (command.orderFulfillmentPackageId) {
      // Update tracking on existing package
      pkg = await this.packageRepo.updateTracking(command.orderFulfillmentPackageId, {
        trackingNumber: command.trackingNumber,
        shippingLabelUrl: command.shippingLabelUrl,
        commercialInvoiceUrl: command.commercialInvoiceUrl,
      });

      if (!pkg) {
        throw new Error('Fulfillment package not found');
      }
    } else {
      // Create a new package record
      const createParams: OrderFulfillmentPackageCreateParams = {
        orderFulfillmentId: command.orderFulfillmentId,
        packageNumber: command.packageNumber,
        trackingNumber: command.trackingNumber,
        weight: command.weight,
        dimensions: command.dimensions,
        packageType: command.packageType,
        shippingLabelUrl: command.shippingLabelUrl,
        commercialInvoiceUrl: command.commercialInvoiceUrl,
        customsInfo: command.customsInfo,
      };

      pkg = await this.packageRepo.create(createParams);
    }

    return {
      orderFulfillmentPackageId: pkg.orderFulfillmentPackageId,
      orderFulfillmentId: pkg.orderFulfillmentId,
      packageNumber: pkg.packageNumber,
      trackingNumber: pkg.trackingNumber,
      shippingLabelUrl: pkg.shippingLabelUrl,
      commercialInvoiceUrl: pkg.commercialInvoiceUrl,
      weight: pkg.weight,
      dimensions: pkg.dimensions,
      packageType: pkg.packageType,
      customsInfo: pkg.customsInfo,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
