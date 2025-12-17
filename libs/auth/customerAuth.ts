import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * JWT Authentication middleware for customer routes
 * Validates Bearer token and attaches customer info to req.user
 */
export const authenticateCustomerJWT = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Not authenticated - continue without user
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      // Empty token - continue without user
      return next();
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
    const decoded = jwt.verify(token, secret) as any;

    if (decoded && decoded.customerId) {
      // Attach customer info to request
      (req as any).user = {
        customerId: decoded.customerId,
        email: decoded.email,
        type: 'customer'
      };
    }

    next();
  } catch (error: any) {
    // Token invalid/expired - continue without user
    next();
  }
};
