import { Request, Response } from 'express';
import { PaymentRepo } from '../repos/paymentRepo';

export class PaymentPublicController {
  private paymentRepo: PaymentRepo;

  constructor() {
    this.paymentRepo = new PaymentRepo();
  }

  // Get available payment methods for customers
  getActivePaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.paymentRepo.findActivePaymentMethods();
      
      // Filter out sensitive data
      const filteredMethods = methods.map(method => ({
        id: method.id,
        name: method.name,
        code: method.code,
        provider: method.provider,
        requiresCustomerSaved: method.requiresCustomerSaved
      }));
      
      res.status(200).json({
        success: true,
        data: filteredMethods
      });
    } catch (error) {
      console.error('Error fetching active payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods'
      });
    }
  };

  // Get customer payment methods
  getCustomerPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, this would come from authenticated user
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const methods = await this.paymentRepo.findCustomerPaymentMethods(customerId);
      
      // Filter out sensitive data
      const filteredMethods = methods.map(method => ({
        id: method.id,
        paymentMethodId: method.paymentMethodId,
        last4: method.last4,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        cardType: method.cardType,
        isDefault: method.isDefault
      }));
      
      res.status(200).json({
        success: true,
        data: filteredMethods
      });
    } catch (error) {
      console.error('Error fetching customer payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer payment methods'
      });
    }
  };

  // Add a new payment method for a customer
  addCustomerPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, customerId would come from authenticated user
      const { customerId } = req.params;
      const { 
        paymentMethodId, 
        gatewayId, 
        token,
        last4,
        expiryMonth,
        expiryYear,
        cardType,
        isDefault 
      } = req.body;
      
      // Validate required fields
      if (!customerId || !paymentMethodId || !gatewayId || !token) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: paymentMethodId, gatewayId, and token are required'
        });
        return;
      }
      
      // Validate payment method exists and is active
      const paymentMethod = await this.paymentRepo.findPaymentMethodById(paymentMethodId);
      if (!paymentMethod || !paymentMethod.isActive) {
        res.status(400).json({
          success: false,
          message: 'Invalid or inactive payment method'
        });
        return;
      }
      
      // Validate gateway exists and is active
      const gateway = await this.paymentRepo.findPaymentGatewayById(gatewayId);
      if (!gateway || !gateway.isActive) {
        res.status(400).json({
          success: false,
          message: 'Invalid or inactive payment gateway'
        });
        return;
      }
      
      // In a real implementation, we would verify the token with the gateway
      // before saving it to our database
      
      const newMethod = await this.paymentRepo.createCustomerPaymentMethod({
        customerId,
        paymentMethodId,
        gatewayId,
        token,
        last4,
        expiryMonth,
        expiryYear,
        cardType,
        isDefault: isDefault ?? false
      });
      
      // Filter out sensitive data for response
      const filteredMethod = {
        id: newMethod.id,
        paymentMethodId: newMethod.paymentMethodId,
        last4: newMethod.last4,
        expiryMonth: newMethod.expiryMonth,
        expiryYear: newMethod.expiryYear,
        cardType: newMethod.cardType,
        isDefault: newMethod.isDefault
      };
      
      res.status(201).json({
        success: true,
        data: filteredMethod
      });
    } catch (error) {
      console.error('Error adding customer payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add customer payment method'
      });
    }
  };

  // Set a customer payment method as default
  setDefaultPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // In a real app, we would verify that the method belongs to the authenticated user
      
      const method = await this.paymentRepo.findCustomerPaymentMethodById(id);
      if (!method) {
        res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
        return;
      }
      
      const updatedMethod = await this.paymentRepo.updateCustomerPaymentMethod(id, {
        isDefault: true
      });
      
      // Filter out sensitive data for response
      const filteredMethod = {
        id: updatedMethod.id,
        paymentMethodId: updatedMethod.paymentMethodId,
        last4: updatedMethod.last4,
        expiryMonth: updatedMethod.expiryMonth,
        expiryYear: updatedMethod.expiryYear,
        cardType: updatedMethod.cardType,
        isDefault: updatedMethod.isDefault
      };
      
      res.status(200).json({
        success: true,
        data: filteredMethod
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set default payment method'
      });
    }
  };

  // Remove a customer payment method
  removePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // In a real app, we would verify that the method belongs to the authenticated user
      
      const method = await this.paymentRepo.findCustomerPaymentMethodById(id);
      if (!method) {
        res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
        return;
      }
      
      const deleted = await this.paymentRepo.deleteCustomerPaymentMethod(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Payment method deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete payment method'
        });
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove payment method'
      });
    }
  };

  // Process a payment
  processPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        orderId,
        customerId,
        amount,
        currency,
        paymentMethodId,
        gatewayId,
        customerPaymentMethodId
      } = req.body;
      
      // Validate required fields
      if (!orderId || !customerId || !amount || !currency || !paymentMethodId || !gatewayId) {
        res.status(400).json({
          success: false,
          message: 'Missing required payment information'
        });
        return;
      }
      
      // If a saved payment method is provided, verify it belongs to the customer
      if (customerPaymentMethodId) {
        const savedMethod = await this.paymentRepo.findCustomerPaymentMethodById(customerPaymentMethodId);
        if (!savedMethod || savedMethod.customerId !== customerId) {
          res.status(400).json({
            success: false,
            message: 'Invalid payment method'
          });
          return;
        }
      }
      
      // In a real implementation, we would integrate with the payment gateway
      // and process the payment. Here we're simulating a successful payment.
      
      const newPayment = await this.paymentRepo.createPayment({
        orderId,
        customerId,
        amount,
        currency,
        status: 'completed', // In real implementation, this would initially be 'pending'
        paymentMethodId,
        gatewayId,
        transactionId: `tr_${Date.now()}`, // In a real implementation, this would come from the gateway
        gatewayResponse: { success: true }, // This would be the actual response from the gateway
        errorMessage: undefined,
        refundedAmount: 0,
        metadata: { processedAt: new Date().toISOString() }
      });
      
      res.status(201).json({
        success: true,
        data: {
          id: newPayment.id,
          orderId: newPayment.orderId,
          amount: newPayment.amount,
          currency: newPayment.currency,
          status: newPayment.status,
          transactionId: newPayment.transactionId
        }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment'
      });
    }
  };

  // Get payment by ID (for receipt)
  getPaymentReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      // In a real app, we would verify that the payment belongs to the authenticated user
      
      const payment = await this.paymentRepo.findPaymentById(id);
      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
        return;
      }
      
      // Filter out sensitive data
      const receipt = {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        paymentDate: payment.createdAt,
        refundedAmount: payment.refundedAmount
      };
      
      res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      console.error('Error fetching payment receipt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment receipt'
      });
    }
  };

  // Get customer payment history
  getCustomerPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, this would come from authenticated user
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const payments = await this.paymentRepo.findPaymentsByCustomerId(customerId);
      
      // Filter out sensitive information
      const filteredPayments = payments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId,
        paymentDate: payment.createdAt,
        refundedAmount: payment.refundedAmount
      }));
      
      res.status(200).json({
        success: true,
        data: filteredPayments
      });
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer payments'
      });
    }
  };
}
