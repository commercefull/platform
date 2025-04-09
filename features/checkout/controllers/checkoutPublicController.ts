import { Request, Response } from 'express';
import checkoutRepo, { 
  Address, 
} from '../repos/checkoutRepo';

export class CheckoutPublicController {
  // Initialize a new checkout session
  async initializeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { basketId, customerId, guestEmail } = req.body;
      
      if (!basketId) {
        res.status(400).json({ 
          success: false, 
          error: 'Basket ID is required' 
        });
        return;
      }
      
      // Check if there's an existing active session for this basket
      const existingSession = await checkoutRepo.findCheckoutSessionByBasketId(basketId);
      
      if (existingSession) {
        res.status(200).json({
          success: true,
          data: existingSession,
          message: 'Existing checkout session found'
        });
        return;
      }
      
      // Create a new checkout session
      const session = await checkoutRepo.createCheckoutSession(
        basketId,
        customerId,
        guestEmail
      );
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'Checkout session created successfully'
      });
    } catch (error) {
      console.error('Failed to initialize checkout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize checkout'
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
  
  // Update shipping address
  async updateShippingAddress(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const address: Address = req.body;
      
      // Validate address
      if (!this.validateAddress(address)) {
        res.status(400).json({
          success: false,
          error: 'Invalid shipping address'
        });
        return;
      }
      
      const updatedSession = await checkoutRepo.setShippingAddress(sessionId, address);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found'
        });
        return;
      }
      
      // Recalculate totals (may affect tax based on shipping location)
      const sessionWithTotals = await checkoutRepo.calculateOrderTotals(sessionId);
      
      res.status(200).json({
        success: true,
        data: sessionWithTotals,
        message: 'Shipping address updated successfully'
      });
    } catch (error) {
      console.error('Failed to update shipping address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update shipping address'
      });
    }
  }
  
  // Update billing address
  async updateBillingAddress(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const address: Address = req.body;
      
      // Validate address
      if (!this.validateAddress(address)) {
        res.status(400).json({
          success: false,
          error: 'Invalid billing address'
        });
        return;
      }
      
      const updatedSession = await checkoutRepo.setBillingAddress(sessionId, address);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedSession,
        message: 'Billing address updated successfully'
      });
    } catch (error) {
      console.error('Failed to update billing address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update billing address'
      });
    }
  }
  
  // Get all available shipping methods
  async getShippingMethods(req: Request, res: Response): Promise<void> {
    try {
      const methods = await checkoutRepo.findAllShippingMethods();
      
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
  
  // Select shipping method
  async selectShippingMethod(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { shippingMethodId } = req.body;
      
      if (!shippingMethodId) {
        res.status(400).json({
          success: false,
          error: 'Shipping method ID is required'
        });
        return;
      }
      
      const updatedSession = await checkoutRepo.setShippingMethod(sessionId, shippingMethodId);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session or shipping method not found'
        });
        return;
      }
      
      // Recalculate totals (shipping cost changed)
      const sessionWithTotals = await checkoutRepo.calculateOrderTotals(sessionId);
      
      res.status(200).json({
        success: true,
        data: sessionWithTotals,
        message: 'Shipping method selected successfully'
      });
    } catch (error) {
      console.error('Failed to select shipping method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to select shipping method'
      });
    }
  }
  
  // Get all available payment methods
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const methods = await checkoutRepo.findAllPaymentMethods();
      
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
  
  // Select payment method
  async selectPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        res.status(400).json({
          success: false,
          error: 'Payment method ID is required'
        });
        return;
      }
      
      const updatedSession = await checkoutRepo.setPaymentMethod(sessionId, paymentMethodId);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session or payment method not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedSession,
        message: 'Payment method selected successfully'
      });
    } catch (error) {
      console.error('Failed to select payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to select payment method'
      });
    }
  }
  
  // Calculate order totals
  async calculateTotals(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const updatedSession = await checkoutRepo.calculateOrderTotals(sessionId);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedSession
      });
    } catch (error) {
      console.error('Failed to calculate order totals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate order totals'
      });
    }
  }
  
  // Complete checkout and create order
  async completeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      // Validate checkout session
      const validation = await checkoutRepo.validateCheckoutSession(sessionId);
      
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          errors: validation.errors
        });
        return;
      }
      
      // Complete checkout and create order
      const result = await checkoutRepo.completeCheckout(sessionId);
      
      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors
        });
        return;
      }
      
      res.status(201).json({
        success: true,
        data: {
          orderId: result.orderId
        },
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Failed to complete checkout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete checkout'
      });
    }
  }
  
  // Abandon checkout session
  async abandonCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const updatedSession = await checkoutRepo.abandonCheckoutSession(sessionId);
      
      if (!updatedSession) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedSession,
        message: 'Checkout session abandoned successfully'
      });
    } catch (error) {
      console.error('Failed to abandon checkout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to abandon checkout'
      });
    }
  }
  
  // Helper method to validate address
  private validateAddress(address: Address): boolean {
    const requiredFields = [
      'firstName',
      'lastName',
      'addressLine1',
      'city',
      'postalCode',
      'country'
    ];
    
    return requiredFields.every(field => Boolean((address as any)[field]));
  }
}

export default new CheckoutPublicController();
