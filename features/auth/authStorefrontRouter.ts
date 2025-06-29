import express from 'express';
import { CustomerAuthController } from './controllers/customerAuthController';
import { MerchantAuthController } from './controllers/merchantAuthController';
import { isCustomerLoggedIn, isMerchantLoggedIn } from '../../libs/auth';

// Create custom interface to use with the middleware
interface AuthRequest extends express.Request {
  authUser?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const customerAuthController = new CustomerAuthController();

// Customer public routes
router.post('/customer/login', (req, res) => customerAuthController.login(req, res));
router.post('/customer/register', (req, res) => customerAuthController.register(req, res));
router.post('/customer/token', (req, res) => customerAuthController.generateToken(req, res));
router.post('/customer/token/refresh', isCustomerLoggedIn, (req, res) => customerAuthController.refreshToken(req, res));
router.post('/customer/token/validate', (req, res) => customerAuthController.validateTokenEndpoint(req, res));

// Password reset (for both customer and merchant)
router.post('/password-reset/request', (req, res) => customerAuthController.requestPasswordReset(req, res));
router.post('/password-reset/reset', (req, res) => customerAuthController.resetPassword(req, res));

export default router;
