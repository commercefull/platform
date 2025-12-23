/**
 * Calculate Order Tax Use Case
 * Calculates tax for an order based on items, shipping address, and customer exemptions
 */

import taxQueryRepo from '../../repos/taxQueryRepo';

// ============================================================================
// Command
// ============================================================================

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxCategoryId?: string;
  taxable?: boolean;
}

export interface TaxAddress {
  country: string;
  region?: string;
  state?: string;
  postalCode?: string;
  city?: string;
}

export class CalculateOrderTaxCommand {
  constructor(
    public readonly items: OrderLineItem[],
    public readonly shippingAddress: TaxAddress,
    public readonly shippingAmount: number = 0,
    public readonly customerId?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface TaxLineItem {
  productId: string;
  name: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
}

export interface CalculateOrderTaxResponse {
  success: boolean;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  lineItems: TaxLineItem[];
  message?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CalculateOrderTaxUseCase {
  async execute(command: CalculateOrderTaxCommand): Promise<CalculateOrderTaxResponse> {
    try {
      // Validate input
      if (!command.items || command.items.length === 0) {
        return {
          success: false,
          subtotal: 0,
          shippingAmount: command.shippingAmount,
          taxAmount: 0,
          total: command.shippingAmount,
          taxRate: 0,
          lineItems: [],
          message: 'No items to calculate tax for'
        };
      }

      if (!command.shippingAddress?.country) {
        return {
          success: false,
          subtotal: 0,
          shippingAmount: command.shippingAmount,
          taxAmount: 0,
          total: command.shippingAmount,
          taxRate: 0,
          lineItems: [],
          message: 'Shipping address country is required for tax calculation'
        };
      }

      // Get the tax rate for the shipping address
      const taxRate = await taxQueryRepo.getTaxRateForAddress({
        country: command.shippingAddress.country,
        region: command.shippingAddress.region || command.shippingAddress.state,
        postalCode: command.shippingAddress.postalCode,
        city: command.shippingAddress.city
      });

      // Check for customer tax exemptions if customerId is provided
      let isExempt = false;
      if (command.customerId) {
        const exemptions = await taxQueryRepo.findCustomerTaxExemptions(
          command.customerId,
          'active'
        );
        isExempt = exemptions.length > 0;
      }

      // Calculate subtotal and tax for each line item
      let subtotal = 0;
      const lineItems: TaxLineItem[] = [];

      for (const item of command.items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        subtotal += itemSubtotal;

        // Calculate tax for this item (skip if not taxable or customer is exempt)
        const shouldTax = (item.taxable !== false) && !isExempt;
        const itemTaxAmount = shouldTax ? (itemSubtotal * taxRate / 100) : 0;

        lineItems.push({
          productId: item.productId,
          name: item.name,
          subtotal: itemSubtotal,
          taxAmount: itemTaxAmount,
          taxRate: shouldTax ? taxRate : 0
        });
      }

      // Calculate tax on shipping (if applicable and not exempt)
      const shippingTaxAmount = !isExempt ? (command.shippingAmount * taxRate / 100) : 0;

      // Calculate total tax
      const totalTaxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0) + shippingTaxAmount;

      // Calculate grand total
      const total = subtotal + command.shippingAmount + totalTaxAmount;

      return {
        success: true,
        subtotal,
        shippingAmount: command.shippingAmount,
        taxAmount: totalTaxAmount,
        total,
        taxRate,
        lineItems,
        message: isExempt ? 'Customer is tax exempt' : undefined
      };
    } catch (error: any) {
      
      
      // Return a safe fallback with zero tax
      const subtotal = command.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      return {
        success: false,
        subtotal,
        shippingAmount: command.shippingAmount,
        taxAmount: 0,
        total: subtotal + command.shippingAmount,
        taxRate: 0,
        lineItems: command.items.map(item => ({
          productId: item.productId,
          name: item.name,
          subtotal: item.quantity * item.unitPrice,
          taxAmount: 0,
          taxRate: 0
        })),
        message: error.message || 'Failed to calculate tax'
      };
    }
  }
}

export const calculateOrderTaxUseCase = new CalculateOrderTaxUseCase();
