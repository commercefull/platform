import express from "express";
import { MerchantAuthController } from "./controllers/merchantAuthController";
import { isMerchantLoggedIn } from "../../libs/auth";

// Create custom interface to use with the middleware
interface AuthRequest extends express.Request {
  authUser?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();
const merchantAuthController = new MerchantAuthController();

// Merchant public routes
router.post('/merchant/login', (req, res) => merchantAuthController.login(req, res));
router.post('/merchant/register', (req, res) => merchantAuthController.register(req, res));
router.post('/merchant/token', (req, res) => merchantAuthController.generateToken(req, res));
router.post('/merchant/token/refresh', isMerchantLoggedIn, (req, res) => merchantAuthController.refreshToken(req, res));
router.post('/merchant/token/validate', (req, res) => merchantAuthController.validateTokenEndpoint(req, res));

// Password reset (for both customer and merchant)
router.post('/merchant/password-reset/request', (req, res) => merchantAuthController.requestPasswordReset(req, res));
router.post('/merchant/password-reset/reset', (req, res) => merchantAuthController.resetPassword(req, res));

export const authRouterAdmin = router;
