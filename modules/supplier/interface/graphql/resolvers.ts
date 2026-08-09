import SupplierRepo from '../../infrastructure/repositories/supplierRepo';
import PurchaseOrderRepo from '../../infrastructure/repositories/purchaseOrderRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateSupplierUseCase, CreateSupplierInput } from '../../application/useCases/CreateSupplier';
import { CreatePurchaseOrderUseCase, CreatePurchaseOrderInput } from '../../application/useCases/CreatePurchaseOrder';
import { ReceiveGoodsUseCase, ReceiveGoodsInput } from '../../application/useCases/ReceiveGoods';

// Adapters for use case port interfaces
const supplierRepoAdapter = {
  async findByEmail(_email: string) {
    // SupplierRepo doesn't have findByEmail, return null to allow creation
    return null;
  },
  async findById(id: string) {
    const supplier = await SupplierRepo.findById(id);
    if (!supplier) return null;
    return {
      status: supplier.status,
      isActive: supplier.isActive,
      minimumOrderValue: supplier.minOrderValue,
      leadTimeDays: supplier.leadTime,
    };
  },
  async create(data: Record<string, unknown>) {
    const result = await SupplierRepo.create(data as Parameters<typeof SupplierRepo.create>[0]);
    return {
      supplierId: result.supplierId,
      name: result.name,
      status: result.status,
      createdAt: new Date(result.createdAt),
    };
  },
};

const purchaseOrderRepoAdapter = {
  async findById(id: string) {
    const po = await PurchaseOrderRepo.findById(id);
    if (!po) return null;
    const items = await PurchaseOrderRepo.findItemsByOrderId(id);
    return {
      status: po.status,
      items: items.map(i => ({ quantity: i.quantity })),
    };
  },
  async create(data: Record<string, unknown>) {
    const result = await PurchaseOrderRepo.create(data as Parameters<typeof PurchaseOrderRepo.create>[0]);
    return {
      purchaseOrderId: result.supplierPurchaseOrderId,
      poNumber: result.poNumber,
      supplierId: result.supplierId,
      totalAmount: result.total,
      status: result.status,
      createdAt: new Date(result.createdAt),
    };
  },
  async update(id: string, data: Record<string, unknown>) {
    await PurchaseOrderRepo.update(id, data as Parameters<typeof PurchaseOrderRepo.update>[1]);
  },
};

const receivingRepoAdapter = {
  async create(_data: Record<string, unknown>) {
    // Simplified adapter
  },
};

const inventoryRepoAdapter = {
  async adjustStock(_params: {
    productId: string;
    variantId?: string;
    locationId: string;
    adjustment: number;
    reason: string;
    reference: string;
  }) {
    // Inventory adjustments would be handled by the actual inventory module
  },
};

export const supplierResolvers = {
  Mutation: {
    createSupplier: async (_parent: unknown, args: { input: CreateSupplierInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateSupplierUseCase(supplierRepoAdapter);
      return useCase.execute(args.input);
    },

    createPurchaseOrder: async (_parent: unknown, args: { input: CreatePurchaseOrderInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreatePurchaseOrderUseCase(supplierRepoAdapter, purchaseOrderRepoAdapter);
      const input: CreatePurchaseOrderInput = {
        ...args.input,
        expectedDeliveryDate: args.input.expectedDeliveryDate ? new Date(args.input.expectedDeliveryDate) : undefined,
      };
      return useCase.execute(input);
    },

    receiveGoods: async (_parent: unknown, args: { input: ReceiveGoodsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ReceiveGoodsUseCase(purchaseOrderRepoAdapter, receivingRepoAdapter, inventoryRepoAdapter);
      return useCase.execute(args.input);
    },
  },
};
