import { Request, Response } from 'express';
import paymentRepo from '../repos/paymentRepo';
import { errorResponse, successResponse } from '../../../libs/apiResponse';

export class PaymentController {
  // ---------- Payment Gateway Methods ----------

  getGateways = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      
      if (!merchantId) {
        errorResponse(res, 'Merchant ID is required', 400);
        return;
      }
      
      const gateways = await paymentRepo.findAllGateways(merchantId);
      successResponse(res, gateways);
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      errorResponse(res, 'Failed to fetch payment gateways');
    }
  };

  getGatewayById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const gateway = await paymentRepo.findGatewayById(id);
      
      if (!gateway) {
        errorResponse(res, `Payment gateway with ID ${id} not found`, 404);
        return;
      }
      
      successResponse(res, gateway);
    } catch (error) {
      console.error(`Error fetching payment gateway:`, error);
      errorResponse(res, 'Failed to fetch payment gateway');
    }
  };

  createGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const gatewayData = req.body;
      
      if (!gatewayData.merchantId) {
        errorResponse(res, 'Merchant ID is required', 400);
        return;
      }
      
      // Handle potential default gateway
      if (gatewayData.isDefault) {
        // Default is handled in the repository
      }
      
      const gateway = await paymentRepo.createGateway(gatewayData);
      successResponse(res, gateway, 201);
    } catch (error) {
      console.error('Error creating payment gateway:', error);
      errorResponse(res, 'Failed to create payment gateway');
    }
  };

  updateGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const gatewayData = req.body;
      
      const gateway = await paymentRepo.updateGateway(id, gatewayData);
      successResponse(res, gateway);
    } catch (error) {
      console.error('Error updating payment gateway:', error);
      errorResponse(res, 'Failed to update payment gateway');
    }
  };

  deleteGateway = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await paymentRepo.deleteGateway(id);
      
      if (result) {
        successResponse(res, { message: 'Payment gateway deleted successfully' });
      } else {
        errorResponse(res, 'Failed to delete payment gateway', 500);
      }
    } catch (error) {
      console.error('Error deleting payment gateway:', error);
      errorResponse(res, 'Failed to delete payment gateway');
    }
  };

  // ---------- Payment Method Config Methods ----------

  getMethodConfigs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantId } = req.params;
      
      if (!merchantId) {
        errorResponse(res, 'Merchant ID is required', 400);
        return;
      }
      
      const methodConfigs = await paymentRepo.findAllMethodConfigs(merchantId);
      successResponse(res, methodConfigs);
    } catch (error) {
      console.error('Error fetching payment method configurations:', error);
      errorResponse(res, 'Failed to fetch payment method configurations');
    }
  };

  getMethodConfigById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const methodConfig = await paymentRepo.findMethodConfigById(id);
      
      if (!methodConfig) {
        errorResponse(res, `Payment method configuration with ID ${id} not found`, 404);
        return;
      }
      
      successResponse(res, methodConfig);
    } catch (error) {
      console.error(`Error fetching payment method configuration:`, error);
      errorResponse(res, 'Failed to fetch payment method configuration');
    }
  };

  createMethodConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const methodConfigData = req.body;
      
      if (!methodConfigData.merchantId) {
        errorResponse(res, 'Merchant ID is required', 400);
        return;
      }
      
      if (!methodConfigData.paymentMethod) {
        errorResponse(res, 'Payment method type is required', 400);
        return;
      }
      
      const methodConfig = await paymentRepo.createMethodConfig(methodConfigData);
      successResponse(res, methodConfig, 201);
    } catch (error) {
      console.error('Error creating payment method configuration:', error);
      errorResponse(res, 'Failed to create payment method configuration');
    }
  };

  updateMethodConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const methodConfigData = req.body;
      
      const methodConfig = await paymentRepo.updateMethodConfig(id, methodConfigData);
      successResponse(res, methodConfig);
    } catch (error) {
      console.error('Error updating payment method configuration:', error);
      errorResponse(res, 'Failed to update payment method configuration');
    }
  };

  deleteMethodConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await paymentRepo.deleteMethodConfig(id);
      
      if (result) {
        successResponse(res, { message: 'Payment method configuration deleted successfully' });
      } else {
        errorResponse(res, 'Failed to delete payment method configuration', 500);
      }
    } catch (error) {
      console.error('Error deleting payment method configuration:', error);
      errorResponse(res, 'Failed to delete payment method configuration');
    }
  };

  // ---------- Transaction Methods ----------

  getTransactionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const transaction = await paymentRepo.findTransactionById(id);
      
      if (!transaction) {
        errorResponse(res, `Transaction with ID ${id} not found`, 404);
        return;
      }
      
      successResponse(res, transaction);
    } catch (error) {
      console.error(`Error fetching transaction:`, error);
      errorResponse(res, 'Failed to fetch transaction');
    }
  };

  getTransactionsByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        errorResponse(res, 'Order ID is required', 400);
        return;
      }
      
      const transactions = await paymentRepo.findTransactionsByOrderId(orderId);
      successResponse(res, transactions);
    } catch (error) {
      console.error('Error fetching transactions by order ID:', error);
      errorResponse(res, 'Failed to fetch transactions');
    }
  };

  updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const transactionData = req.body;
      
      // In a real implementation, you'd have validation and business logic
      // to ensure proper status transitions and other rules
      
      const transaction = await paymentRepo.updateTransaction(id, transactionData);
      successResponse(res, transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      errorResponse(res, 'Failed to update transaction');
    }
  };

  // ---------- Refund Methods ----------

  getRefundById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const refund = await paymentRepo.findRefundById(id);
      
      if (!refund) {
        errorResponse(res, `Refund with ID ${id} not found`, 404);
        return;
      }
      
      successResponse(res, refund);
    } catch (error) {
      console.error(`Error fetching refund:`, error);
      errorResponse(res, 'Failed to fetch refund');
    }
  };

  getRefundsByTransactionId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        errorResponse(res, 'Transaction ID is required', 400);
        return;
      }
      
      const refunds = await paymentRepo.findRefundsByTransactionId(transactionId);
      successResponse(res, refunds);
    } catch (error) {
      console.error('Error fetching refunds by transaction ID:', error);
      errorResponse(res, 'Failed to fetch refunds');
    }
  };

  createRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const refundData = req.body;
      
      if (!refundData.transactionId) {
        errorResponse(res, 'Transaction ID is required', 400);
        return;
      }
      
      if (!refundData.amount || refundData.amount <= 0) {
        errorResponse(res, 'Valid refund amount is required', 400);
        return;
      }
      
      // Get the transaction to validate and extract currency
      const transaction = await paymentRepo.findTransactionById(refundData.transactionId);
      
      if (!transaction) {
        errorResponse(res, 'Transaction not found', 404);
        return;
      }
      
      // Check if the transaction can be refunded
      if (!['paid', 'partially_refunded'].includes(transaction.status)) {
        errorResponse(res, `Transaction with status '${transaction.status}' cannot be refunded`, 400);
        return;
      }
      
      // Calculate the maximum refundable amount
      const alreadyRefunded = transaction.refundedAmount || 0;
      const maxRefundable = transaction.amount - alreadyRefunded;
      
      if (refundData.amount > maxRefundable) {
        errorResponse(res, `Maximum refundable amount is ${maxRefundable} ${transaction.currency}`, 400);
        return;
      }
      
      // Set currency from transaction if not provided
      if (!refundData.currency) {
        refundData.currency = transaction.currency;
      }
      
      const refund = await paymentRepo.createRefund(refundData);
      successResponse(res, refund, 201);
    } catch (error) {
      console.error('Error creating refund:', error);
      errorResponse(res, 'Failed to create refund');
    }
  };

  updateRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const refundData = req.body;
      
      const refund = await paymentRepo.updateRefund(id, refundData);
      successResponse(res, refund);
    } catch (error) {
      console.error('Error updating refund:', error);
      errorResponse(res, 'Failed to update refund');
    }
  };
}

export default new PaymentController();
