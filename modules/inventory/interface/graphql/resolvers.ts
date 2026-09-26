import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import type { GetInventoryItemInput } from '../../application/useCases/GetInventoryItem';
import type { ListInventoryItemsInput } from '../../application/useCases/ListInventoryItems';
import type { GetLowStockItemsInput } from '../../application/useCases/GetLowStockItems';
import type { GetOutOfStockItemsInput } from '../../application/useCases/GetOutOfStockItems';
import type { ReserveStockInput } from '../../application/useCases/ReserveStock';
import {
  getInventoryItemUseCase,
  listInventoryItemsUseCase,
  getLowStockItemsUseCase,
  getOutOfStockItemsUseCase,
  reserveStockUseCase,
} from '../../application/wired';

export const inventoryResolvers = {
  Query: {
    inventoryItem: async (
      _parent: unknown,
      args: {
        inventoryItemId?: string;
        sku?: string;
        productId?: string;
        variantId?: string;
        warehouseId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: GetInventoryItemInput = {
        inventoryItemId: args.inventoryItemId,
        sku: args.sku,
        productId: args.productId,
        variantId: args.variantId,
        warehouseId: args.warehouseId,
      };
      return getInventoryItemUseCase.execute(input);
    },

    inventoryItems: async (
      _parent: unknown,
      args: {
        input?: ListInventoryItemsInput;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      return listInventoryItemsUseCase.execute(args.input || {});
    },

    lowStockItems: async (
      _parent: unknown,
      args: {
        warehouseId?: string;
        threshold?: number;
        page?: number;
        limit?: number;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: GetLowStockItemsInput = {
        warehouseId: args.warehouseId,
        threshold: args.threshold,
        page: args.page,
        limit: args.limit,
      };
      return getLowStockItemsUseCase.execute(input);
    },

    outOfStockItems: async (
      _parent: unknown,
      args: {
        warehouseId?: string;
        includeReserved?: boolean;
        page?: number;
        limit?: number;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: GetOutOfStockItemsInput = {
        warehouseId: args.warehouseId,
        includeReserved: args.includeReserved,
        page: args.page,
        limit: args.limit,
      };
      return getOutOfStockItemsUseCase.execute(input);
    },
  },

  Mutation: {
    reserveStock: async (
      _parent: unknown,
      args: {
        orderId: string;
        items: Array<{ productId: string; variantId?: string; sku?: string; quantity: number; locationId?: string }>;
        expiresAt?: string;
        channelId?: string;
        storeId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: ReserveStockInput = {
        orderId: args.orderId,
        items: args.items,
        expiresAt: args.expiresAt ? new Date(args.expiresAt) : undefined,
        channelId: args.channelId,
        storeId: args.storeId,
      };
      return reserveStockUseCase.execute(input);
    },
  },
};
