import express from "express";
import { AuthController } from './controllers/authController';
import { authenticateToken, isAdmin } from './middleware/authMiddleware';

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

// Admin login
router.post('/login', (req, res) => {
  // This would use an adminLogin method that we'd need to add to the AuthController
  // For now, we'll return a not implemented response
  res.status(501).json({ success: false, message: 'Admin login not implemented yet' });
});

// Protected admin routes
router.use(authenticateToken, isAdmin);

// Merchant account management
router.get('/merchants/pending', (req: AuthRequest, res) => {
  // This would retrieve pending merchant accounts
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

router.put('/merchants/:id/approve', (req: AuthRequest, res) => {
  // This would approve a merchant account
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

router.put('/merchants/:id/reject', (req: AuthRequest, res) => {
  // This would reject a merchant account
  res.status(501).json({ success: false, message: 'Not implemented yet' });
});

export const authRouterAdmin = router;
