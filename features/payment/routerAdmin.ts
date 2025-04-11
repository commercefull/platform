import express from 'express';
import paymentController from './controllers/paymentController';

const router = express.Router();

// Payment Gateway Routes
router.get('/merchants/:merchantId/gateways', paymentController.getGateways);
router.get('/gateways/:id', paymentController.getGatewayById);
router.post('/gateways', paymentController.createGateway);
router.put('/gateways/:id', paymentController.updateGateway);
router.delete('/gateways/:id', paymentController.deleteGateway);

// Payment Method Config Routes
router.get('/merchants/:merchantId/method-configs', paymentController.getMethodConfigs);
router.get('/method-configs/:id', paymentController.getMethodConfigById);
router.post('/method-configs', paymentController.createMethodConfig);
router.put('/method-configs/:id', paymentController.updateMethodConfig);
router.delete('/method-configs/:id', paymentController.deleteMethodConfig);

// Transaction Routes
router.get('/transactions/:id', paymentController.getTransactionById);
router.get('/orders/:orderId/transactions', paymentController.getTransactionsByOrderId);
router.put('/transactions/:id', paymentController.updateTransaction);

// Refund Routes
router.get('/refunds/:id', paymentController.getRefundById);
router.get('/transactions/:transactionId/refunds', paymentController.getRefundsByTransactionId);
router.post('/refunds', paymentController.createRefund);
router.put('/refunds/:id', paymentController.updateRefund);

export default router;
