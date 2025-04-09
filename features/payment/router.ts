import express from 'express';
import { PaymentPublicController } from './controllers/paymentPublicController';

const router = express.Router();
const paymentPublicController = new PaymentPublicController();

// Public payment method routes
router.get('/payment-methods', paymentPublicController.getActivePaymentMethods);

// Customer payment method management
router.get('/customers/:customerId/payment-methods', paymentPublicController.getCustomerPaymentMethods);
router.post('/customers/:customerId/payment-methods', paymentPublicController.addCustomerPaymentMethod);
router.put('/customer-payment-methods/:id/set-default', paymentPublicController.setDefaultPaymentMethod);
router.delete('/customer-payment-methods/:id', paymentPublicController.removePaymentMethod);

// Payment processing
router.post('/payments/process', paymentPublicController.processPayment);
router.get('/payments/:id/receipt', paymentPublicController.getPaymentReceipt);
router.get('/customers/:customerId/payments', paymentPublicController.getCustomerPayments);

export default router;
