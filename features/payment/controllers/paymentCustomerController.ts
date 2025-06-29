import { Request, Response } from 'express';
import paymentRepo, { PaymentMethodConfig, PaymentGateway, PaymentTransaction } from '../repos/paymentRepo';
import { errorResponse, successResponse } from '../../../libs/apiResponse';

// Get available payment methods for customers
export const getActivePaymentMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get the merchant ID from the request (this would typically come from the session or site context)
      const merchantId = req.params.merchantId || 
                         (req.query.merchantId ? String(req.query.merchantId) : '1'); // Default for testing
      
      const methodConfigs = await paymentRepo.findEnabledMethodConfigs(merchantId);
      
      // Filter out sensitive data
      const filteredMethods = methodConfigs.map(method => ({
        id: method.id,
        name: method.displayName || method.paymentMethod,
        code: method.paymentMethod,
        description: method.description,
        icon: method.icon,
        supportedCurrencies: method.supportedCurrencies,
        minimumAmount: method.minimumAmount,
        maximumAmount: method.maximumAmount
      }));
      
      successResponse(res, filteredMethods);
    } catch (error) {
      console.error('Error fetching active payment methods:', error);
      errorResponse(res, 'Failed to fetch payment methods');
    }
};

// Get customer payment transactions
export const getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const { limit = 10, page = 1 } = req.query;
      
      if (!customerId) {
        errorResponse(res, 'Customer ID is required', 400);
        return;
      }
      
      const offset = (Number(page) - 1) * Number(limit);
      const transactions = await paymentRepo.findTransactionsByCustomerId(
        customerId, 
        Number(limit), 
        offset
      );
      
      // Filter sensitive data
      const filteredTransactions = transactions.map(tx => ({
        id: tx.id,
        orderId: tx.orderId,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt
      }));
      
      successResponse(res, filteredTransactions);
    } catch (error) {
      console.error('Error fetching customer payment transactions:', error);
      errorResponse(res, 'Failed to fetch payment transactions');
    }
};

// Get single transaction details
export const getTransactionDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        errorResponse(res, 'Transaction ID is required', 400);
        return;
      }
      
      const transaction = await paymentRepo.findTransactionById(transactionId);
      
      if (!transaction) {
        errorResponse(res, 'Transaction not found', 404);
        return;
      }
      
      // Check if the transaction belongs to the authenticated customer
      // In a real app, you would validate the customer ID from the authenticated session
      const authenticatedCustomerId = req.query.customerId;
      if (transaction.customerId !== authenticatedCustomerId) {
        errorResponse(res, 'Unauthorized access to transaction', 403);
        return;
      }
      
      // Filter sensitive data
      const filteredTransaction = {
        id: transaction.id,
        orderId: transaction.orderId,
        customerId: transaction.customerId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentMethodDetails: transaction.paymentMethodDetails,
        refundedAmount: transaction.refundedAmount,
        createdAt: transaction.createdAt,
        capturedAt: transaction.capturedAt
      };
      
      successResponse(res, filteredTransaction);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      errorResponse(res, 'Failed to fetch transaction details');
    }
};

// Initiate a refund request
export const requestRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const { amount, reason } = req.body;
      
      if (!transactionId) {
        errorResponse(res, 'Transaction ID is required', 400);
        return;
      }
      
      if (!amount || amount <= 0) {
        errorResponse(res, 'Valid refund amount is required', 400);
        return;
      }
      
      // Get the transaction to validate
      const transaction = await paymentRepo.findTransactionById(transactionId);
      
      if (!transaction) {
        errorResponse(res, 'Transaction not found', 404);
        return;
      }
      
      // Check if the transaction belongs to the authenticated customer
      // In a real app, you would validate the customer ID from the authenticated session
      const authenticatedCustomerId = req.query.customerId;
      if (transaction.customerId !== authenticatedCustomerId) {
        errorResponse(res, 'Unauthorized access to transaction', 403);
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
      
      if (amount > maxRefundable) {
        errorResponse(res, `Maximum refundable amount is ${maxRefundable} ${transaction.currency}`, 400);
        return;
      }
      
      // Create a refund request
      const refund = await paymentRepo.createRefund({
        transactionId,
        amount,
        currency: transaction.currency,
        reason: reason || 'Customer requested refund',
        status: 'pending'
      });
      
      successResponse(res, refund, 201);
    } catch (error) {
      console.error('Error creating refund request:', error);
      errorResponse(res, 'Failed to process refund request');
    }
};

// Get refunds for a transaction
export const getTransactionRefunds = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        errorResponse(res, 'Transaction ID is required', 400);
        return;
      }
      
      // Get the transaction to validate
      const transaction = await paymentRepo.findTransactionById(transactionId);
      
      if (!transaction) {
        errorResponse(res, 'Transaction not found', 404);
        return;
      }
      
      // Check if the transaction belongs to the authenticated customer
      // In a real app, you would validate the customer ID from the authenticated session
      const authenticatedCustomerId = req.query.customerId;
      if (transaction.customerId !== authenticatedCustomerId) {
        errorResponse(res, 'Unauthorized access to transaction', 403);
        return;
      }
      
      const refunds = await paymentRepo.findRefundsByTransactionId(transactionId);
      
      // Filter sensitive data
      const filteredRefunds = refunds.map(refund => ({
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        createdAt: refund.createdAt
      }));
      
      successResponse(res, filteredRefunds);
    } catch (error) {
      console.error('Error fetching transaction refunds:', error);
      errorResponse(res, 'Failed to fetch refunds');
    }
};

