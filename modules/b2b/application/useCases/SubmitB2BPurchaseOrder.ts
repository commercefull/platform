/**
 * Submit B2B Purchase Order Use Case
 * Validates credit availability, creates PO and items
 */

import * as b2bCompanyCreditTransactionRepo from '../../infrastructure/repositories/b2bCompanyCreditTransactionRepo';
import * as b2bCompanyCreditLimitRepo from '../../infrastructure/repositories/b2bCompanyCreditLimitRepo';
import * as b2bPurchaseOrderRepo from '../../infrastructure/repositories/b2bPurchaseOrderRepo';
import * as b2bPurchaseOrderItemRepo from '../../infrastructure/repositories/b2bPurchaseOrderItemRepo';

export interface SubmitB2BPurchaseOrderCommand {
  b2bCompanyId: string;
  currency?: string;
  notes?: string;
  items: Array<{
    productId?: string;
    productVariantId?: string;
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
}

export interface SubmitB2BPurchaseOrderResponse {
  success: boolean;
  purchaseOrder?: {
    b2bPurchaseOrderId: string;
    b2bCompanyId: string;
    status: string;
    totalAmount: number;
    currency: string;
    itemCount: number;
    createdAt: Date;
  };
  error?: string;
}

export class SubmitB2BPurchaseOrderUseCase {
  async execute(command: SubmitB2BPurchaseOrderCommand): Promise<SubmitB2BPurchaseOrderResponse> {
    try {
      if (!command.b2bCompanyId) {
        return { success: false, error: 'Company ID is required' };
      }
      if (!command.items || command.items.length === 0) {
        return { success: false, error: 'At least one item is required' };
      }

      // Calculate total order amount
      const totalAmount = command.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      // Check credit availability
      const creditLimit = await b2bCompanyCreditLimitRepo.findByCompany(command.b2bCompanyId);
      if (creditLimit) {
        const currentBalance = await b2bCompanyCreditTransactionRepo.getBalance(command.b2bCompanyId);
        const available = creditLimit.creditLimit - currentBalance;
        if (totalAmount > available) {
          return {
            success: false,
            error: `Insufficient credit. Available: ${available}, Required: ${totalAmount}`,
          };
        }
      }

      // Create the purchase order
      const po = await b2bPurchaseOrderRepo.create({
        b2bCompanyId: command.b2bCompanyId,
        currency: command.currency ?? 'USD',
        totalAmount,
        notes: command.notes,
      });

      // Create order items
      for (const item of command.items) {
        await b2bPurchaseOrderItemRepo.create({
          b2bPurchaseOrderId: po.b2bPurchaseOrderId,
          productId: item.productId,
          productVariantId: item.productVariantId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        });
      }

      // Update status to submitted
      const submitted = await b2bPurchaseOrderRepo.updateStatus(po.b2bPurchaseOrderId, 'submitted');

      return {
        success: true,
        purchaseOrder: {
          b2bPurchaseOrderId: po.b2bPurchaseOrderId,
          b2bCompanyId: po.b2bCompanyId,
          status: submitted?.status ?? 'submitted',
          totalAmount,
          currency: po.currency,
          itemCount: command.items.length,
          createdAt: po.createdAt,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
