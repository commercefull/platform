import express from 'express';
import { AuthController } from './controllers/authController';
import { authenticateToken, isCustomer, isMerchant } from './middleware/authMiddleware';

// Create custom interface to use with the middleware
interface AuthRequest extends express.Request {
  authUser?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const authController = new AuthController();

// Customer public routes
router.post('/customer/login', (req, res) => authController.customerLogin(req, res));
router.post('/customer/register', (req, res) => authController.customerRegister(req, res));

// Merchant public routes
router.post('/merchant/login', (req, res) => authController.merchantLogin(req, res));
router.post('/merchant/register', (req, res) => authController.merchantRegister(req, res));

// Password reset (for both customer and merchant)
router.post('/password-reset/request', (req, res) => authController.requestPasswordReset(req, res));
router.post('/password-reset/reset', (req, res) => authController.resetPassword(req, res));

// Protected routes that require authentication
// These routes demonstrate how to use the authentication middleware
router.get('/customer/profile', authenticateToken, isCustomer, (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.authUser
  });
});

router.get('/merchant/profile', authenticateToken, isMerchant, (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.authUser
  });
});

// Verify token validity
router.get('/verify-token', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    user: req.authUser
  });
});

export default router;
