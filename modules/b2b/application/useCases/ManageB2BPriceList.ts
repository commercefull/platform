/**
 * Manage B2B Price List Use Case
 * Creates or updates a price list and its items
 */

import * as b2bPriceListRepo from '../../infrastructure/repositories/b2bPriceListRepo';
import * as b2bPriceListItemRepo from '../../infrastructure/repositories/b2bPriceListItemRepo';

export interface ManageB2BPriceListCommand {
  b2bPriceListId?: string; // if provided, update; otherwise create
  b2bCompanyId?: string;
  name: string;
  currency?: string;
  isActive?: boolean;
  notes?: string;
  items?: Array<{
    b2bPriceListItemId?: string; // if provided, update; otherwise create
    productId: string;
    productVariantId?: string;
    price: number;
    currency?: string;
  }>;
}

export interface ManageB2BPriceListResponse {
  success: boolean;
  priceList?: {
    b2bPriceListId: string;
    name: string;
    currency: string;
    isActive: boolean;
    itemCount: number;
  };
  error?: string;
}

export class ManageB2BPriceListUseCase {
  async execute(command: ManageB2BPriceListCommand): Promise<ManageB2BPriceListResponse> {
    try {
      if (!command.name) {
        return { success: false, error: 'Price list name is required' };
      }

      let priceList;

      if (command.b2bPriceListId) {
        // Update existing price list
        priceList = await b2bPriceListRepo.update(command.b2bPriceListId, {
          name: command.name,
          currency: command.currency,
          isActive: command.isActive,
          notes: command.notes,
        });
        if (!priceList) {
          return { success: false, error: 'Price list not found' };
        }
      } else {
        // Create new price list
        priceList = await b2bPriceListRepo.create({
          b2bCompanyId: command.b2bCompanyId,
          name: command.name,
          currency: command.currency,
          isActive: command.isActive,
          notes: command.notes,
        });
      }

      // Manage items if provided
      if (command.items && command.items.length > 0) {
        for (const item of command.items) {
          if (item.b2bPriceListItemId) {
            await b2bPriceListItemRepo.update(item.b2bPriceListItemId, {
              price: item.price,
              currency: item.currency,
            });
          } else {
            await b2bPriceListItemRepo.create({
              b2bPriceListId: priceList.b2bPriceListId,
              productId: item.productId,
              productVariantId: item.productVariantId,
              price: item.price,
              currency: item.currency,
            });
          }
        }
      }

      const allItems = await b2bPriceListItemRepo.findByPriceList(priceList.b2bPriceListId);

      return {
        success: true,
        priceList: {
          b2bPriceListId: priceList.b2bPriceListId,
          name: priceList.name,
          currency: priceList.currency,
          isActive: priceList.isActive,
          itemCount: allItems.length,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
