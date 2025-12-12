/**
 * Pre-Order Customer Controller
 * Handles customer-facing operations for pre-orders
 */

import { Request, Response, NextFunction } from 'express';
import * as preOrderRepo from '../repos/preOrderRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const getProductPreOrder: AsyncHandler = async (req, res, next) => {
  try {
    const { productId, productVariantId } = req.params;
    const preOrder = await preOrderRepo.getPreOrderByProduct(productId, productVariantId);
    
    if (!preOrder) {
      res.status(404).json({ success: false, message: 'Pre-order not available' });
      return;
    }

    const available = preOrder.maxQuantity 
      ? preOrder.maxQuantity - preOrder.reservedQuantity 
      : null;

    res.json({
      success: true,
      data: {
        ...preOrder,
        availableQuantity: available,
        isAvailable: preOrder.status === 'active' && (available === null || available > 0)
      }
    });
  } catch (error: any) {
    console.error('Get product pre-order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPreOrderReservation: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { preOrderId, quantity, paymentIntentId } = req.body;

    const preOrder = await preOrderRepo.getPreOrder(preOrderId);
    if (!preOrder) {
      res.status(404).json({ success: false, message: 'Pre-order not found' });
      return;
    }

    const unitPrice = preOrder.preOrderPrice || preOrder.regularPrice || 0;
    let depositPaid = 0;

    if (preOrder.requiresDeposit) {
      if (preOrder.depositAmount) {
        depositPaid = preOrder.depositAmount * quantity;
      } else if (preOrder.depositPercent) {
        depositPaid = unitPrice * quantity * (preOrder.depositPercent / 100);
      }
    }

    const reservation = await preOrderRepo.createReservation({
      distributionPreOrderId: preOrderId,
      customerId,
      quantity,
      unitPrice,
      depositPaid,
      paymentIntentId
    });

    res.status(201).json({ success: true, data: reservation });
  } catch (error: any) {
    console.error('Create pre-order reservation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyReservations: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;

    const result = await preOrderRepo.getReservations(
      { customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get my reservations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyReservation: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const reservation = await preOrderRepo.getReservation(req.params.id);

    if (!reservation || reservation.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    const preOrder = await preOrderRepo.getPreOrder(reservation.distributionPreOrderId);
    res.json({ success: true, data: { ...reservation, preOrder } });
  } catch (error: any) {
    console.error('Get my reservation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelMyReservation: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const reservation = await preOrderRepo.getReservation(req.params.id);

    if (!reservation || reservation.customerId !== customerId) {
      res.status(404).json({ success: false, message: 'Reservation not found' });
      return;
    }

    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
      res.status(400).json({ success: false, message: 'Cannot cancel this reservation' });
      return;
    }

    await preOrderRepo.cancelReservation(req.params.id, req.body.reason);
    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (error: any) {
    console.error('Cancel my reservation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
