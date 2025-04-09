import { Request, Response } from 'express';
import checkoutRepo, { 
  PaymentMethod, 
  ShippingMethod 
} from '../repos/checkoutRepo';
import { unixTimestamp } from '../../../libs/date';
// Import missing dependencies
import { query, queryOne } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';


export class CheckoutController {
  // Get all checkout sessions
  async getAllCheckoutSessions(req: Request, res: Response): Promise<void> {
    try {
      const { status, customerId } = req.query;
      
      // Different queries based on filters
      let sessions;
      if (customerId) {
        sessions = await checkoutRepo.findCheckoutSessionsByCustomerId(customerId as string);
        
        // Filter by status if provided
        if (status) {
          sessions = sessions.filter(s => s.status === status);
        }
      } else {
        // For admin, we would need a method to get all sessions with pagination
        // This would require adding a new method to the repository
        sessions = await query(
          `SELECT * FROM "public"."checkout_session" 
          ${status ? 'WHERE status = $1' : ''}
          ORDER BY "createdAt" DESC 
          LIMIT 100`,
          status ? [status] : []
        );
      }
      
      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Failed to get checkout sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkout sessions'
      });
    }
  }
  
  // Get checkout session by ID
  async getCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await checkoutRepo.findCheckoutSessionById(sessionId);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: session
      });
    } catch (error) {
      console.error('Failed to get checkout session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get checkout session'
      });
    }
  }
  
  // Clean up expired sessions
  async cleanupExpiredSessions(req: Request, res: Response): Promise<void> {
    try {
      const count = await checkoutRepo.cleanupExpiredSessions();
      
      res.status(200).json({
        success: true,
        data: {
          expiredSessionsCount: count
        },
        message: `${count} expired sessions cleaned up`
      });
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired sessions'
      });
    }
  }
  
  // SHIPPING METHODS MANAGEMENT
  
  // Get all shipping methods
  async getAllShippingMethods(req: Request, res: Response): Promise<void> {
    try {
      // Get all shipping methods, including disabled ones for admin
      const methods = await query(
        `SELECT * FROM "public"."shipping_method" ORDER BY "name" ASC`,
        []
      );
      
      res.status(200).json({
        success: true,
        data: methods
      });
    } catch (error) {
      console.error('Failed to get shipping methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get shipping methods'
      });
    }
  }
  
  // Create shipping method
  async createShippingMethod(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        price,
        estimatedDeliveryTime,
        isDefault = false,
        isEnabled = true,
        metadata
      } = req.body;
      
      // Validate required fields
      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Name is required'
        });
        return;
      }
      
      // Set default flag for other methods to false if this is default
      if (isDefault) {
        await query(
          `UPDATE "public"."shipping_method" SET "isDefault" = false WHERE "isDefault" = true`,
          []
        );
      }
      
      const id = generateUUID();
      const now = unixTimestamp();
      
      const newMethod: ShippingMethod = {
        id,
        name,
        description,
        price: price || 0,
        estimatedDeliveryTime,
        isDefault,
        isEnabled,
        metadata,
        createdAt: String(now),
        updatedAt: String(now)
      };
      
      await query(
        `INSERT INTO "public"."shipping_method" 
        (id, name, description, price, "estimatedDeliveryTime", "isDefault", "isEnabled", metadata, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newMethod.id,
          newMethod.name,
          newMethod.description,
          newMethod.price,
          newMethod.estimatedDeliveryTime,
          newMethod.isDefault,
          newMethod.isEnabled,
          JSON.stringify(newMethod.metadata),
          newMethod.createdAt,
          newMethod.updatedAt
        ]
      );
      
      res.status(201).json({
        success: true,
        data: newMethod,
        message: 'Shipping method created successfully'
      });
    } catch (error) {
      console.error('Failed to create shipping method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create shipping method'
      });
    }
  }
  
  // Update shipping method
  async updateShippingMethod(req: Request, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;
      const {
        name,
        description,
        price,
        estimatedDeliveryTime,
        isDefault,
        isEnabled,
        metadata
      } = req.body;
      
      // Get the current method
      const currentMethod = await queryOne<ShippingMethod>(
        `SELECT * FROM "public"."shipping_method" WHERE id = $1`,
        [methodId]
      );
      
      if (!currentMethod) {
        res.status(404).json({
          success: false,
          error: 'Shipping method not found'
        });
        return;
      }
      
      // Set default flag for other methods to false if this is becoming default
      if (isDefault && !currentMethod.isDefault) {
        await query(
          `UPDATE "public"."shipping_method" SET "isDefault" = false WHERE "isDefault" = true`,
          []
        );
      }
      
      const now = unixTimestamp();
      
      const updatedMethod: ShippingMethod = {
        ...currentMethod,
        name: name !== undefined ? name : currentMethod.name,
        description: description !== undefined ? description : currentMethod.description,
        price: price !== undefined ? price : currentMethod.price,
        estimatedDeliveryTime: estimatedDeliveryTime !== undefined ? estimatedDeliveryTime : currentMethod.estimatedDeliveryTime,
        isDefault: isDefault !== undefined ? isDefault : currentMethod.isDefault,
        isEnabled: isEnabled !== undefined ? isEnabled : currentMethod.isEnabled,
        metadata: metadata !== undefined ? metadata : currentMethod.metadata,
        updatedAt: String(now)
      };
      
      await query(
        `UPDATE "public"."shipping_method" SET
        name = $1,
        description = $2,
        price = $3,
        "estimatedDeliveryTime" = $4,
        "isDefault" = $5,
        "isEnabled" = $6,
        metadata = $7,
        "updatedAt" = $8
        WHERE id = $9`,
        [
          updatedMethod.name,
          updatedMethod.description,
          updatedMethod.price,
          updatedMethod.estimatedDeliveryTime,
          updatedMethod.isDefault,
          updatedMethod.isEnabled,
          JSON.stringify(updatedMethod.metadata),
          updatedMethod.updatedAt,
          methodId
        ]
      );
      
      res.status(200).json({
        success: true,
        data: updatedMethod,
        message: 'Shipping method updated successfully'
      });
    } catch (error) {
      console.error('Failed to update shipping method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update shipping method'
      });
    }
  }
  
  // Delete shipping method
  async deleteShippingMethod(req: Request, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;
      
      // Get the current method
      const currentMethod = await queryOne<ShippingMethod>(
        `SELECT * FROM "public"."shipping_method" WHERE id = $1`,
        [methodId]
      );
      
      if (!currentMethod) {
        res.status(404).json({
          success: false,
          error: 'Shipping method not found'
        });
        return;
      }
      
      // Check if this is the only shipping method
      const count = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM "public"."shipping_method"`,
        []
      );
      
      if (count && count.count <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete the only shipping method'
        });
        return;
      }
      
      // Check if this is the default method
      if (currentMethod.isDefault) {
        // Set another method as default
        await query(
          `UPDATE "public"."shipping_method" 
          SET "isDefault" = true 
          WHERE id != $1 
          LIMIT 1`,
          [methodId]
        );
      }
      
      // Delete the shipping method
      await query(
        `DELETE FROM "public"."shipping_method" WHERE id = $1`,
        [methodId]
      );
      
      res.status(200).json({
        success: true,
        message: 'Shipping method deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete shipping method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete shipping method'
      });
    }
  }
  
  // PAYMENT METHODS MANAGEMENT
  
  // Get all payment methods
  async getAllPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      // Get all payment methods, including disabled ones for admin
      const methods = await query(
        `SELECT * FROM "public"."payment_method" ORDER BY "name" ASC`,
        []
      );
      
      res.status(200).json({
        success: true,
        data: methods
      });
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment methods'
      });
    }
  }
  
  // Create payment method
  async createPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        type,
        isDefault = false,
        isEnabled = true,
        processorId,
        processorConfig,
        metadata
      } = req.body;
      
      // Validate required fields
      if (!name || !type) {
        res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
        return;
      }
      
      // Validate payment method type
      const validTypes = ['credit_card', 'paypal', 'bank_transfer', 'other'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Type must be one of: ${validTypes.join(', ')}`
        });
        return;
      }
      
      // Set default flag for other methods to false if this is default
      if (isDefault) {
        await query(
          `UPDATE "public"."payment_method" SET "isDefault" = false WHERE "isDefault" = true`,
          []
        );
      }
      
      const id = generateUUID();
      const now = unixTimestamp();
      
      const newMethod: PaymentMethod = {
        id,
        name,
        type,
        isDefault,
        isEnabled,
        processorId,
        processorConfig,
        metadata,
        createdAt: String(now),
        updatedAt: String(now)
      };
      
      await query(
        `INSERT INTO "public"."payment_method" 
        (id, name, type, "isDefault", "isEnabled", "processorId", "processorConfig", metadata, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newMethod.id,
          newMethod.name,
          newMethod.type,
          newMethod.isDefault,
          newMethod.isEnabled,
          newMethod.processorId,
          JSON.stringify(newMethod.processorConfig),
          JSON.stringify(newMethod.metadata),
          newMethod.createdAt,
          newMethod.updatedAt
        ]
      );
      
      res.status(201).json({
        success: true,
        data: newMethod,
        message: 'Payment method created successfully'
      });
    } catch (error) {
      console.error('Failed to create payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment method'
      });
    }
  }
  
  // Update payment method
  async updatePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;
      const {
        name,
        type,
        isDefault,
        isEnabled,
        processorId,
        processorConfig,
        metadata
      } = req.body;
      
      // Get the current method
      const currentMethod = await queryOne<PaymentMethod>(
        `SELECT * FROM "public"."payment_method" WHERE id = $1`,
        [methodId]
      );
      
      if (!currentMethod) {
        res.status(404).json({
          success: false,
          error: 'Payment method not found'
        });
        return;
      }
      
      // Validate payment method type if changing
      if (type) {
        const validTypes = ['credit_card', 'paypal', 'bank_transfer', 'other'];
        if (!validTypes.includes(type)) {
          res.status(400).json({
            success: false,
            error: `Type must be one of: ${validTypes.join(', ')}`
          });
          return;
        }
      }
      
      // Set default flag for other methods to false if this is becoming default
      if (isDefault && !currentMethod.isDefault) {
        await query(
          `UPDATE "public"."payment_method" SET "isDefault" = false WHERE "isDefault" = true`,
          []
        );
      }
      
      const now = unixTimestamp();
      
      const updatedMethod: PaymentMethod = {
        ...currentMethod,
        name: name !== undefined ? name : currentMethod.name,
        type: type !== undefined ? type : currentMethod.type,
        isDefault: isDefault !== undefined ? isDefault : currentMethod.isDefault,
        isEnabled: isEnabled !== undefined ? isEnabled : currentMethod.isEnabled,
        processorId: processorId !== undefined ? processorId : currentMethod.processorId,
        processorConfig: processorConfig !== undefined ? processorConfig : currentMethod.processorConfig,
        metadata: metadata !== undefined ? metadata : currentMethod.metadata,
        updatedAt: String(now)
      };
      
      await query(
        `UPDATE "public"."payment_method" SET
        name = $1,
        type = $2,
        "isDefault" = $3,
        "isEnabled" = $4,
        "processorId" = $5,
        "processorConfig" = $6,
        metadata = $7,
        "updatedAt" = $8
        WHERE id = $9`,
        [
          updatedMethod.name,
          updatedMethod.type,
          updatedMethod.isDefault,
          updatedMethod.isEnabled,
          updatedMethod.processorId,
          JSON.stringify(updatedMethod.processorConfig),
          JSON.stringify(updatedMethod.metadata),
          updatedMethod.updatedAt,
          methodId
        ]
      );
      
      res.status(200).json({
        success: true,
        data: updatedMethod,
        message: 'Payment method updated successfully'
      });
    } catch (error) {
      console.error('Failed to update payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment method'
      });
    }
  }
  
  // Delete payment method
  async deletePaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;
      
      // Get the current method
      const currentMethod = await queryOne<PaymentMethod>(
        `SELECT * FROM "public"."payment_method" WHERE id = $1`,
        [methodId]
      );
      
      if (!currentMethod) {
        res.status(404).json({
          success: false,
          error: 'Payment method not found'
        });
        return;
      }
      
      // Check if this is the only payment method
      const count = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM "public"."payment_method"`,
        []
      );
      
      if (count && count.count <= 1) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete the only payment method'
        });
        return;
      }
      
      // Check if this is the default method
      if (currentMethod.isDefault) {
        // Set another method as default
        await query(
          `UPDATE "public"."payment_method" 
          SET "isDefault" = true 
          WHERE id != $1 
          LIMIT 1`,
          [methodId]
        );
      }
      
      // Delete the payment method
      await query(
        `DELETE FROM "public"."payment_method" WHERE id = $1`,
        [methodId]
      );
      
      res.status(200).json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete payment method'
      });
    }
  }
}

export default new CheckoutController();
