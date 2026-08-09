import InventoryRepo from '../../infrastructure/repositories/InventoryRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetInventoryItemUseCase, GetInventoryItemInput } from '../../application/useCases/GetInventoryItem';
import { ListInventoryItemsUseCase, ListInventoryItemsInput } from '../../application/useCases/ListInventoryItems';
import { GetLowStockItemsUseCase, GetLowStockItemsInput } from '../../application/useCases/GetLowStockItems';
import { GetOutOfStockItemsUseCase, GetOutOfStockItemsInput } from '../../application/useCases/GetOutOfStockItems';
import { ReserveStockUseCase, ReserveStockInput } from '../../application/useCases/ReserveStock';

// The InventoryRepository implements all these methods but the use case port interfaces
// are structurally narrower. Use type assertions to satisfy the constraints.
type GetItemRepo = ConstructorParameters<typeof GetInventoryItemUseCase>[0];
type ListItemsRepo = ConstructorParameters<typeof ListInventoryItemsUseCase>[0];
type LowStockRepo = ConstructorParameters<typeof GetLowStockItemsUseCase>[0];
type OutOfStockRepo = ConstructorParameters<typeof GetOutOfStockItemsUseCase>[0];
type ReserveRepo = ConstructorParameters<typeof ReserveStockUseCase>[0];

export const inventoryResolvers = {
  Query: {
    inventoryItem: async (_parent: unknown, args: {
      inventoryItemId?: string;
      sku?: string;
      productId?: string;
      variantId?: string;
      warehouseId?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetInventoryItemUseCase(InventoryRepo as unknown as GetItemRepo);
      const input: GetInventoryItemInput = {
        inventoryItemId: args.inventoryItemId,
        sku: args.sku,
        productId: args.productId,
        variantId: args.variantId,
        warehouseId: args.warehouseId,
      };
      return useCase.execute(input);
    },

    inventoryItems: async (_parent: unknown, args: {
      input?: ListInventoryItemsInput;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListInventoryItemsUseCase(InventoryRepo as unknown as ListItemsRepo);
      return useCase.execute(args.input || {});
    },

    lowStockItems: async (_parent: unknown, args: {
      warehouseId?: string;
      threshold?: number;
      page?: number;
      limit?: number;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetLowStockItemsUseCase(InventoryRepo as unknown as LowStockRepo);
      const input: GetLowStockItemsInput = {
        warehouseId: args.warehouseId,
        threshold: args.threshold,
        page: args.page,
        limit: args.limit,
      };
      return useCase.execute(input);
    },

    outOfStockItems: async (_parent: unknown, args: {
      warehouseId?: string;
      includeReserved?: boolean;
      page?: number;
      limit?: number;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetOutOfStockItemsUseCase(InventoryRepo as unknown as OutOfStockRepo);
      const input: GetOutOfStockItemsInput = {
        warehouseId: args.warehouseId,
        includeReserved: args.includeReserved,
        page: args.page,
        limit: args.limit,
      };
      return useCase.execute(input);
    },
  },

  Mutation: {
    reserveStock: async (_parent: unknown, args: {
      orderId: string;
      items: Array<{ productId: string; variantId?: string; sku?: string; quantity: number; locationId?: string }>;
      expiresAt?: string;
      channelId?: string;
      storeId?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ReserveStockUseCase(InventoryRepo as unknown as ReserveRepo);
      const input: ReserveStockInput = {
        orderId: args.orderId,
        items: args.items,
        expiresAt: args.expiresAt ? new Date(args.expiresAt) : undefined,
        channelId: args.channelId,
        storeId: args.storeId,
      };
      return useCase.execute(input);
    },
  },
};
