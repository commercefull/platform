/**
 * Unit Tests for StoreDispatch Entity
 */

import { StoreDispatch, DispatchStatus } from './StoreDispatch';
import { InventoryValidationError } from '../errors/InventoryErrors';

describe('StoreDispatch', () => {
  function createDispatch(status?: string, dispatchedQty?: number): StoreDispatch {
    return StoreDispatch.reconstitute({
      dispatchId: 'disp-1',
      fromStoreId: 'store-1',
      toStoreId: 'store-2',
      dispatchNumber: 'DSP-001',
      status: (status as DispatchStatus) || 'draft',
      items: [
        {
          dispatchItemId: 'item-1',
          dispatchId: 'disp-1',
          productId: 'prod-1',
          requestedQuantity: 10,
          dispatchedQuantity: dispatchedQty ?? 0,
          receivedQuantity: 0,
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  describe('create', () => {
    it('should create a dispatch in draft status by default', () => {
      const dispatch = StoreDispatch.create({
        dispatchId: 'disp-1',
        fromStoreId: 'store-1',
        toStoreId: 'store-2',
        dispatchNumber: 'DSP-001',
        items: [
          { dispatchItemId: 'item-1', productId: 'prod-1', requestedQuantity: 10 },
        ],
      });

      expect(dispatch.status).toBe('draft');
      expect(dispatch.items).toHaveLength(1);
      expect(dispatch.items[0].dispatchedQuantity).toBe(0);
      expect(dispatch.items[0].receivedQuantity).toBe(0);
    });

    it('should set requestedBy and requestedAt when provided', () => {
      const dispatch = StoreDispatch.create({
        dispatchId: 'disp-1',
        fromStoreId: 'store-1',
        toStoreId: 'store-2',
        dispatchNumber: 'DSP-001',
        items: [{ dispatchItemId: 'item-1', productId: 'prod-1', requestedQuantity: 10 }],
        requestedBy: 'user-1',
      });

      expect(dispatch.requestedBy).toBe('user-1');
      expect(dispatch.requestedAt).toBeDefined();
    });
  });

  describe('approve', () => {
    it('should approve from draft status', () => {
      const dispatch = createDispatch('draft');
      dispatch.approve('manager-1');
      expect(dispatch.status).toBe('approved');
      expect(dispatch.approvedBy).toBe('manager-1');
      expect(dispatch.approvedAt).toBeDefined();
    });

    it('should approve from pending_approval status', () => {
      const dispatch = createDispatch('pending_approval');
      dispatch.approve('manager-1');
      expect(dispatch.status).toBe('approved');
    });

    it('should throw when approving from invalid status', () => {
      const dispatch = createDispatch('dispatched');
      expect(() => dispatch.approve('manager-1')).toThrow(InventoryValidationError);
    });
  });

  describe('markDispatched', () => {
    it('should dispatch from approved status', () => {
      const dispatch = createDispatch('approved');
      dispatch.markDispatched('user-1');
      expect(dispatch.status).toBe('dispatched');
      expect(dispatch.dispatchedBy).toBe('user-1');
      expect(dispatch.dispatchedAt).toBeDefined();
      expect(dispatch.items[0].dispatchedQuantity).toBe(10);
    });

    it('should set dispatched quantities when provided', () => {
      const dispatch = createDispatch('approved');
      dispatch.markDispatched('user-1', [{ dispatchItemId: 'item-1', dispatchedQuantity: 8 }]);
      expect(dispatch.items[0].dispatchedQuantity).toBe(8);
    });

    it('should throw when not approved', () => {
      const dispatch = createDispatch('draft');
      expect(() => dispatch.markDispatched('user-1')).toThrow(InventoryValidationError);
    });

    it('should throw when dispatched quantity exceeds requested', () => {
      const dispatch = createDispatch('approved');
      expect(() => dispatch.markDispatched('user-1', [{ dispatchItemId: 'item-1', dispatchedQuantity: 15 }])).toThrow(InventoryValidationError);
    });
  });

  describe('markInTransit', () => {
    it('should transition from dispatched to in_transit', () => {
      const dispatch = createDispatch('dispatched');
      dispatch.markInTransit();
      expect(dispatch.status).toBe('in_transit');
    });

    it('should throw when not dispatched', () => {
      const dispatch = createDispatch('approved');
      expect(() => dispatch.markInTransit()).toThrow(InventoryValidationError);
    });
  });

  describe('markReceived', () => {
    it('should receive from dispatched status', () => {
      const dispatch = createDispatch('dispatched', 10);
      dispatch.markReceived('user-2', [{ dispatchItemId: 'item-1', receivedQuantity: 10 }]);
      expect(dispatch.status).toBe('received');
      expect(dispatch.receivedBy).toBe('user-2');
      expect(dispatch.receivedAt).toBeDefined();
      expect(dispatch.items[0].receivedQuantity).toBe(10);
    });

    it('should receive from in_transit status', () => {
      const dispatch = createDispatch('in_transit', 10);
      dispatch.markReceived('user-2', [{ dispatchItemId: 'item-1', receivedQuantity: 8 }]);
      expect(dispatch.status).toBe('received');
      expect(dispatch.items[0].receivedQuantity).toBe(8);
    });

    it('should default receivedQuantity to dispatchedQuantity when not specified', () => {
      const dispatch = createDispatch('dispatched', 10);
      dispatch.markReceived('user-2', []);
      expect(dispatch.items[0].receivedQuantity).toBe(10);
    });

    it('should throw when received quantity exceeds dispatched', () => {
      const dispatch = createDispatch('dispatched', 5);
      expect(() => dispatch.markReceived('user-2', [{ dispatchItemId: 'item-1', receivedQuantity: 10 }])).toThrow(InventoryValidationError);
    });

    it('should throw when not dispatched or in transit', () => {
      const dispatch = createDispatch('approved');
      expect(() => dispatch.markReceived('user-2', [])).toThrow(InventoryValidationError);
    });

    it('should append notes', () => {
      const dispatch = createDispatch('dispatched', 10);
      dispatch.markReceived('user-2', [{ dispatchItemId: 'item-1', receivedQuantity: 10 }], 'Partial delivery');
      expect(dispatch.notes).toContain('Partial delivery');
    });
  });

  describe('cancel', () => {
    it('should cancel from draft status', () => {
      const dispatch = createDispatch('draft');
      dispatch.cancel('Not needed');
      expect(dispatch.status).toBe('cancelled');
      expect(dispatch.notes).toContain('Not needed');
    });

    it('should cancel from pending_approval status', () => {
      const dispatch = createDispatch('pending_approval');
      dispatch.cancel();
      expect(dispatch.status).toBe('cancelled');
    });

    it('should throw when cancelling from dispatched', () => {
      const dispatch = createDispatch('dispatched');
      expect(() => dispatch.cancel()).toThrow(InventoryValidationError);
    });

    it('should throw when already received', () => {
      const dispatch = createDispatch('received');
      expect(() => dispatch.cancel()).toThrow(InventoryValidationError);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const dispatch = createDispatch('approved');
      const json = dispatch.toJSON();

      expect(json.dispatchId).toBe('disp-1');
      expect(json.status).toBe('approved');
      expect(json.fromStoreId).toBe('store-1');
      expect(json.toStoreId).toBe('store-2');
    });
  });
});
