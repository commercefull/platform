/**
 * Pre-Order Business Controller
 * Handles admin/merchant operations for pre-orders and reservations
 */

import { Request, Response, NextFunction } from 'express';
import * as preOrderRepo from '../repos/preOrderRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const getPreOrders: AsyncHandler = async (req, res, next) => {
  try {
    const { status, preOrderType, limit, offset } = req.query;
    const result = await preOrderRepo.getPreOrders(
      { status: status as any, preOrderType: preOrderType as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get pre-orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPreOrder: AsyncHandler = async (req, res, next) => {
  try {
    const preOrder = await preOrderRepo.getPreOrder(req.params.id);
    if (!preOrder) {
      res.status(404).json({ success: false, message: 'Pre-order not found' });
      return;
    }
    const reservations = await preOrderRepo.getReservations({ preOrderId: req.params.id });
    res.json({ success: true, data: { ...preOrder, reservations: reservations.data } });
  } catch (error: any) {
    console.error('Get pre-order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPreOrder: AsyncHandler = async (req, res, next) => {
  try {
    const preOrder = await preOrderRepo.savePreOrder(req.body);
    res.status(201).json({ success: true, data: preOrder });
  } catch (error: any) {
    console.error('Create pre-order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePreOrder: AsyncHandler = async (req, res, next) => {
  try {
    const preOrder = await preOrderRepo.savePreOrder({
      distributionPreOrderId: req.params.id,
      ...req.body
    });
    res.json({ success: true, data: preOrder });
  } catch (error: any) {
    console.error('Update pre-order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getReservations: AsyncHandler = async (req, res, next) => {
  try {
    const { preOrderId, customerId, status, limit, offset } = req.query;
    const result = await preOrderRepo.getReservations(
      { preOrderId: preOrderId as string, customerId: customerId as string, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get reservations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fulfillReservation: AsyncHandler = async (req, res, next) => {
  try {
    await preOrderRepo.fulfillReservation(req.params.id, req.body.orderId);
    res.json({ success: true, message: 'Reservation fulfilled' });
  } catch (error: any) {
    console.error('Fulfill reservation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelReservation: AsyncHandler = async (req, res, next) => {
  try {
    await preOrderRepo.cancelReservation(req.params.id, req.body.reason);
    res.json({ success: true, message: 'Reservation cancelled' });
  } catch (error: any) {
    console.error('Cancel reservation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
