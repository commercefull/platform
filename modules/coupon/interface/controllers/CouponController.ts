/**
 * Coupon Controller
 *
 * HTTP interface for coupon management.
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import couponRepository from '../../infrastructure/repositories/CouponRepository';
import {
  CreateCouponUseCase,
  CreateCouponCommand,
  ValidateCouponUseCase,
  ValidateCouponCommand,
  ApplyCouponUseCase,
  RedeemCouponUseCase,
} from '../../application/useCases';

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new CreateCouponUseCase(couponRepository);
    const command = new CreateCouponCommand(
      req.body.code,
      req.body.name,
      req.body.type,
      req.body.value,
      req.body.createdBy,
      req.body.description,
      req.body.currency,
      req.body.minOrderValue,
      req.body.maxDiscountAmount,
      req.body.usageType,
      req.body.usageLimit,
      req.body.customerUsageLimit,
      req.body.startsAt ? new Date(req.body.startsAt) : undefined,
      req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      req.body.applicableProducts,
      req.body.applicableCategories,
      req.body.applicableCustomerGroups,
      req.body.excludedProducts,
      req.body.excludedCategories,
      req.body.metadata,
    );
    const coupon = await useCase.execute(command);
    res.status(201).json({ success: true, data: coupon });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new ValidateCouponUseCase(couponRepository);
    const command = new ValidateCouponCommand(req.body.code || req.params.code, req.body.orderValue, req.body.customerId, req.body.items);
    const result = await useCase.execute(command);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new ApplyCouponUseCase(couponRepository);
    const result = await useCase.execute({
      couponCode: req.body.couponCode || req.body.code,
      basketId: req.body.basketId,
      customerId: req.body.customerId,
      orderTotal: req.body.orderTotal,
      items: req.body.items,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const redeemCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new RedeemCouponUseCase(couponRepository);
    const result = await useCase.execute({
      couponCode: req.body.code,
      orderId: req.body.orderId,
      customerId: req.body.customerId,
      discountAmount: req.body.discountAmount,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await couponRepository.findById(req.params.couponId);
    if (!coupon) {
      res.status(404).json({ success: false, error: 'Coupon not found' });
      return;
    }
    res.json({ success: true, data: coupon });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await couponRepository.findAll(
      {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        type: req.query.type as string | undefined,
        usageType: req.query.usageType as string | undefined,
      },
      {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      },
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    await couponRepository.delete(req.params.couponId);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createCoupon,
  validateCoupon,
  applyCoupon,
  redeemCoupon,
  getCoupon,
  listCoupons,
  deleteCoupon,
};
