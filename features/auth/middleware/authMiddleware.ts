import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthTokenData } from '../repos/authRepo';

// Environment variables should be properly loaded in your application
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';

// Create a custom Request type with the authUser property
interface AuthRequest extends Request {
  authUser?: AuthTokenData;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, String(JWT_SECRET)) as AuthTokenData;
    req.authUser = decoded;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is a customer
export const isCustomer = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.authUser) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  
  if (req.authUser.role !== 'customer') {
    res.status(403).json({ success: false, message: 'Customer access required' });
    return;
  }
  
  next();
};

// Middleware to check if user is a merchant
export const isMerchant = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.authUser) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  
  if (req.authUser.role !== 'merchant') {
    res.status(403).json({ success: false, message: 'Merchant access required' });
    return;
  }
  
  next();
};

// Middleware to check if user is an admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.authUser) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  
  next();
};

// Enhanced middleware that validates token but continues if no token present
export const optionalAuthentication = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // No token, but that's okay - proceed as unauthenticated
    next();
    return;
  }
  
  try {
    const decoded = jwt.verify(token, String(JWT_SECRET)) as AuthTokenData;
    req.authUser = decoded;
    next();
  } catch (error) {
    // Invalid token - proceed as unauthenticated rather than failing
    next();
  }
};
