import express from 'express';
import { PaymentController } from './controllers/paymentController';

const router = express.Router();
const paymentController = new PaymentController();

// Payment Method Routes
router.get('/payment-methods', paymentController.getPaymentMethods);
router.get('/payment-methods/:id', paymentController.getPaymentMethodById);
router.post('/payment-methods', paymentController.createPaymentMethod);
router.put('/payment-methods/:id', paymentController.updatePaymentMethod);
router.delete('/payment-methods/:id', paymentController.deletePaymentMethod);

// Payment Gateway Routes
router.get('/payment-gateways', paymentController.getPaymentGateways);
router.get('/payment-gateways/:id', paymentController.getPaymentGatewayById);
router.post('/payment-gateways', paymentController.createPaymentGateway);
router.put('/payment-gateways/:id', paymentController.updatePaymentGateway);
router.delete('/payment-gateways/:id', paymentController.deletePaymentGateway);

// Customer Payment Method Routes (admin access)
router.get('/customers/:customerId/payment-methods', paymentController.getCustomerPaymentMethods);
router.get('/customer-payment-methods/:id', paymentController.getCustomerPaymentMethodById);
router.put('/customer-payment-methods/:id', paymentController.updateCustomerPaymentMethod);
router.delete('/customer-payment-methods/:id', paymentController.deleteCustomerPaymentMethod);

// Payment Routes
router.get('/payments', paymentController.getPayments);
router.get('/payments/:id', paymentController.getPaymentById);
router.get('/orders/:orderId/payments', paymentController.getPaymentsByOrderId);
router.get('/customers/:customerId/payments', paymentController.getPaymentsByCustomerId);
router.put('/payments/:id/status', paymentController.updatePaymentStatus);

// Refund Routes
router.get('/refunds', paymentController.getRefunds);
router.get('/refunds/:id', paymentController.getRefundById);
router.get('/payments/:paymentId/refunds', paymentController.getRefundsByPaymentId);
router.post('/refunds', paymentController.createRefund);
router.put('/refunds/:id/status', paymentController.updateRefundStatus);

export default router;
