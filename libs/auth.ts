import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

// Environment variables should be properly loaded in your application
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';

const authenticateToken = (req: Request, res: Response, next: NextFunction, secret: string): void => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, String(secret));
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Token validation error:', error);
    // Return 401 for invalid/expired tokens (not 403 which is for authorization failures)
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const isMerchantLoggedIn = (req: Request, res: Response, next: NextFunction) => {

    // Check if it's an AJAX request or API call
    if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
        return authenticateToken(req, res, next, MERCHANT_JWT_SECRET);
    }

    // Check if the request is authenticated
    if (req.isAuthenticated()) {
        return next();
    }
    
    // Redirect for regular HTTP requests
    res.redirect("/merchant/login");
};

export const isCustomerLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
        return authenticateToken(req, res, next, CUSTOMER_JWT_SECRET);
    }
    
    if (req.isAuthenticated()) {
        return next();
    }
    
    res.redirect("/login");
};

/**
 * Middleware to check if a customer is NOT logged in
 * Useful for pages that should only be accessible to non-authenticated users (signup, login)
 */
export const isCustomerNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return res.redirect('/user/profile'); // Redirect to profile if already authenticated
    }
    next(); // Continue if not authenticated
};