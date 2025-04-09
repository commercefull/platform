import { Request, Response } from 'express';
import { PaymentRepo } from '../repos/paymentRepo';

export class PaymentController {
  private paymentRepo: PaymentRepo;

  constructor() {
    this.paymentRepo = new PaymentRepo();
  }

  // ---------- Payment Method Methods ----------

  getPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.paymentRepo.findAllPaymentMethods();
      res.status(200).json({
        success: true,
        data: methods
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods'
      });
    }
  };

  getPaymentMethodById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const method = await this.paymentRepo.findPaymentMethodById(id);
      
      if (!method) {
        res.status(404).json({
          success: false,
          message: `Payment method with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: method
      });
    } catch (error) {
      console.error(`Error fetching payment method:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment method'
      });
    }
  };

  createPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, code, provider, isActive, requiresCustomerSaved, config, testMode } = req.body;
      
      // Validate required fields
      if (!name || !code || !provider) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: name, code, and provider are required'
        });
        return;
      }
      
      const newMethod = await this.paymentRepo.createPaymentMethod({
        name,
        code,
        provider,
        isActive: isActive ?? true,
        requiresCustomerSaved: requiresCustomerSaved ?? false,
        config: config ?? {},
        testMode: testMode ?? false
      });
      
      res.status(201).json({
        success: true,
        data: newMethod
      });
    } catch (error) {
      console.error('Error creating payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment method'
      });
    }
  };

  updatePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, code, provider, isActive, requiresCustomerSaved, config, testMode } = req.body;
      
      const existingMethod = await this.paymentRepo.findPaymentMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: `Payment method with ID ${id} not found`
        });
        return;
      }
      
      const updatedMethod = await this.paymentRepo.updatePaymentMethod(id, {
        name,
        code,
        provider,
        isActive,
        requiresCustomerSaved,
        config,
        testMode
      });
      
      res.status(200).json({
        success: true,
        data: updatedMethod
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment method'
      });
    }
  };

  deletePaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingMethod = await this.paymentRepo.findPaymentMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: `Payment method with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await this.paymentRepo.deletePaymentMethod(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Payment method with ID ${id} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete payment method with ID ${id}`
        });
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment method'
      });
    }
  };

  // ---------- Payment Gateway Methods ----------

  getPaymentGateways = async (req: Request, res: Response): Promise<void> => {
    try {
      const gateways = await this.paymentRepo.findAllPaymentGateways();
      res.status(200).json({
        success: true,
        data: gateways
      });
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment gateways'
      });
    }
  };

  getPaymentGatewayById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const gateway = await this.paymentRepo.findPaymentGatewayById(id);
      
      if (!gateway) {
        res.status(404).json({
          success: false,
          message: `Payment gateway with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: gateway
      });
    } catch (error) {
      console.error(`Error fetching payment gateway:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment gateway'
      });
    }
  };

  createPaymentGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        name, code, apiKey, secretKey, webhookSecret,
        apiEndpoint, isActive, supportedCurrencies,
        supportedPaymentMethods, testMode
      } = req.body;
      
      // Validate required fields
      if (!name || !code) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: name and code are required'
        });
        return;
      }
      
      const newGateway = await this.paymentRepo.createPaymentGateway({
        name,
        code,
        apiKey,
        secretKey,
        webhookSecret,
        apiEndpoint,
        isActive: isActive ?? true,
        supportedCurrencies: supportedCurrencies ?? ['USD'],
        supportedPaymentMethods: supportedPaymentMethods ?? [],
        testMode: testMode ?? false
      });
      
      res.status(201).json({
        success: true,
        data: newGateway
      });
    } catch (error) {
      console.error('Error creating payment gateway:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment gateway'
      });
    }
  };

  updatePaymentGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name, code, apiKey, secretKey, webhookSecret,
        apiEndpoint, isActive, supportedCurrencies,
        supportedPaymentMethods, testMode
      } = req.body;
      
      const existingGateway = await this.paymentRepo.findPaymentGatewayById(id);
      if (!existingGateway) {
        res.status(404).json({
          success: false,
          message: `Payment gateway with ID ${id} not found`
        });
        return;
      }
      
      const updatedGateway = await this.paymentRepo.updatePaymentGateway(id, {
        name,
        code,
        apiKey,
        secretKey,
        webhookSecret,
        apiEndpoint,
        isActive,
        supportedCurrencies,
        supportedPaymentMethods,
        testMode
      });
      
      res.status(200).json({
        success: true,
        data: updatedGateway
      });
    } catch (error) {
      console.error('Error updating payment gateway:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment gateway'
      });
    }
  };

  deletePaymentGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingGateway = await this.paymentRepo.findPaymentGatewayById(id);
      if (!existingGateway) {
        res.status(404).json({
          success: false,
          message: `Payment gateway with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await this.paymentRepo.deletePaymentGateway(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Payment gateway with ID ${id} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete payment gateway with ID ${id}`
        });
      }
    } catch (error) {
      console.error('Error deleting payment gateway:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment gateway'
      });
    }
  };

  // ---------- Customer Payment Method Methods ----------

  getCustomerPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const methods = await this.paymentRepo.findCustomerPaymentMethods(customerId);
      
      res.status(200).json({
        success: true,
        data: methods
      });
    } catch (error) {
      console.error('Error fetching customer payment methods:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer payment methods'
      });
    }
  };

  getCustomerPaymentMethodById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const method = await this.paymentRepo.findCustomerPaymentMethodById(id);
      
      if (!method) {
        res.status(404).json({
          success: false,
          message: `Customer payment method with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: method
      });
    } catch (error) {
      console.error('Error fetching customer payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer payment method'
      });
    }
  };

  updateCustomerPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isDefault } = req.body;
      
      const existingMethod = await this.paymentRepo.findCustomerPaymentMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: `Customer payment method with ID ${id} not found`
        });
        return;
      }
      
      const updatedMethod = await this.paymentRepo.updateCustomerPaymentMethod(id, {
        isDefault
      });
      
      res.status(200).json({
        success: true,
        data: updatedMethod
      });
    } catch (error) {
      console.error('Error updating customer payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer payment method'
      });
    }
  };

  deleteCustomerPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingMethod = await this.paymentRepo.findCustomerPaymentMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: `Customer payment method with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await this.paymentRepo.deleteCustomerPaymentMethod(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Customer payment method with ID ${id} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete customer payment method with ID ${id}`
        });
      }
    } catch (error) {
      console.error('Error deleting customer payment method:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer payment method'
      });
    }
  };

  // ---------- Payment Methods ----------

  getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const payments = await this.paymentRepo.findAllPayments();
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  };

  getPaymentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const payment = await this.paymentRepo.findPaymentById(id);
      
      if (!payment) {
        res.status(404).json({
          success: false,
          message: `Payment with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment'
      });
    }
  };

  getPaymentsByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }
      
      const payments = await this.paymentRepo.findPaymentsByOrderId(orderId);
      
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching payments by order ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  };
  
  getPaymentsByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const payments = await this.paymentRepo.findPaymentsByCustomerId(customerId);
      
      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Error fetching payments by customer ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  };

  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, transactionId, gatewayResponse, errorMessage, metadata } = req.body;
      
      const existingPayment = await this.paymentRepo.findPaymentById(id);
      if (!existingPayment) {
        res.status(404).json({
          success: false,
          message: `Payment with ID ${id} not found`
        });
        return;
      }
      
      if (!status || !['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid or missing status value'
        });
        return;
      }
      
      const updatedPayment = await this.paymentRepo.updatePaymentStatus(id, status, {
        transactionId,
        gatewayResponse,
        errorMessage,
        metadata
      });
      
      res.status(200).json({
        success: true,
        data: updatedPayment
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  };

  // ---------- Refund Methods ----------

  getRefunds = async (req: Request, res: Response): Promise<void> => {
    try {
      const refunds = await this.paymentRepo.findAllRefunds();
      res.status(200).json({
        success: true,
        data: refunds
      });
    } catch (error) {
      console.error('Error fetching refunds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch refunds'
      });
    }
  };

  getRefundById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const refund = await this.paymentRepo.findRefundById(id);
      
      if (!refund) {
        res.status(404).json({
          success: false,
          message: `Refund with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: refund
      });
    } catch (error) {
      console.error('Error fetching refund:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch refund'
      });
    }
  };

  getRefundsByPaymentId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
        return;
      }
      
      const refunds = await this.paymentRepo.findRefundsByPaymentId(paymentId);
      
      res.status(200).json({
        success: true,
        data: refunds
      });
    } catch (error) {
      console.error('Error fetching refunds by payment ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch refunds'
      });
    }
  };

  createRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId, amount, reason } = req.body;
      
      // Validate required fields
      if (!paymentId || !amount || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Payment ID and amount (greater than 0) are required'
        });
        return;
      }
      
      // Verify payment exists and can be refunded
      const payment = await this.paymentRepo.findPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          message: `Payment with ID ${paymentId} not found`
        });
        return;
      }
      
      if (payment.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: `Only completed payments can be refunded. Current status: ${payment.status}`
        });
        return;
      }
      
      const currentRefundedAmount = payment.refundedAmount || 0;
      if (currentRefundedAmount + amount > payment.amount) {
        res.status(400).json({
          success: false,
          message: `Refund amount exceeds the available amount. Available: ${payment.amount - currentRefundedAmount}`
        });
        return;
      }
      
      const newRefund = await this.paymentRepo.createRefund({
        paymentId,
        amount,
        reason: reason || 'Customer requested refund',
        status: 'pending',
        transactionId: undefined,
        gatewayResponse: undefined,
        errorMessage: undefined,
        metadata: undefined
      });
      
      res.status(201).json({
        success: true,
        data: newRefund
      });
    } catch (error) {
      console.error('Error creating refund:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create refund'
      });
    }
  };

  updateRefundStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, transactionId, gatewayResponse, errorMessage, metadata } = req.body;
      
      const existingRefund = await this.paymentRepo.findRefundById(id);
      if (!existingRefund) {
        res.status(404).json({
          success: false,
          message: `Refund with ID ${id} not found`
        });
        return;
      }
      
      if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid or missing status value'
        });
        return;
      }
      
      const updatedRefund = await this.paymentRepo.updateRefundStatus(id, status, {
        transactionId,
        gatewayResponse,
        errorMessage,
        metadata
      });
      
      res.status(200).json({
        success: true,
        data: updatedRefund
      });
    } catch (error) {
      console.error('Error updating refund status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update refund status'
      });
    }
  };
}
