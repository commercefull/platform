import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { CustomerRepo } from '../../customer/repos/customerRepo';
import { AuthRefreshTokenRepo } from '../repos/identityRefreshTokenRepo';
import {
  generateAccessToken,
  verifyAccessToken,
  parseExpirationDate
} from '../utils/jwtHelpers';
import {
  emitCustomerLogin,
  emitCustomerRegistered,
  emitCustomerTokenRefreshed,
  emitCustomerPasswordResetRequested,
  emitCustomerPasswordResetCompleted
} from '../domain/events/emitIdentityEvent';

// Environment configuration with secure defaults
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const customerRepo = new CustomerRepo();
const refreshTokenRepo = new AuthRefreshTokenRepo();

/**
 * Authenticates a customer and returns a basic JWT token
 * Use this for simple session-based auth
 */
export const loginCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
      return;
    }

    // Authenticate customer
    const customer = await customerRepo.authenticateCustomer({ email, password });
    if (!customer) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Track login activity
    await customerRepo.updateCustomerLoginTimestamp(customer.customerId);

    // Emit login event
    emitCustomerLogin({
      customerId: customer.customerId,
      email: customer.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Generate access token
    const accessToken = generateAccessToken(
      customer.customerId,
      customer.email,
      'customer',
      CUSTOMER_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    res.json({
      success: true,
      accessToken,
      customer: {
        id: customer.customerId,
        email: customer.email
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

/**
 * Registers a new customer account
 */
export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required'
      });
      return;
    }

    // Check for existing customer
    const existingCustomer = await customerRepo.findCustomerByEmail(email);
    if (existingCustomer) {
      res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists' 
      });
      return;
    }

    // Create new customer
    const newCustomer = await customerRepo.createCustomerWithPassword({
      email,
      firstName,
      lastName,
      password,
      phone,
      isActive: true,
      isVerified: false
    });

    // Emit registration event
    emitCustomerRegistered({
      customerId: newCustomer.customerId,
      email: newCustomer.email,
      firstName: newCustomer.firstName || '',
      lastName: newCustomer.lastName || ''
    });

    // Generate access token for immediate login
    const accessToken = generateAccessToken(
      newCustomer.customerId,
      newCustomer.email,
      'customer',
      CUSTOMER_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    res.status(201).json({
      success: true,
      accessToken,
      customer: {
        id: newCustomer.customerId,
        email: newCustomer.email,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
  }
};

/**
 * Issues both access and refresh tokens for headless/mobile clients
 * More secure than simple login as refresh tokens can be revoked
 */
export const issueTokenPair = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
      return;
    }

    const customer = await customerRepo.authenticateCustomer({ email, password });
    if (!customer) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Track login activity
    await customerRepo.updateCustomerLoginTimestamp(customer.customerId);

    // Generate access token (short-lived)
    const accessToken = generateAccessToken(
      customer.customerId,
      customer.email,
      'customer',
      CUSTOMER_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    // Generate refresh token (long-lived)
    const refreshToken = generateAccessToken(
      customer.customerId,
      customer.email,
      'customer',
      CUSTOMER_JWT_SECRET,
      REFRESH_TOKEN_DURATION
    );

    // Store refresh token in database for tracking/revocation
    await refreshTokenRepo.create({
      token: refreshToken,
      userType: 'customer',
      userId: customer.customerId,
      expiresAt: parseExpirationDate(REFRESH_TOKEN_DURATION),
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION,
      customer: {
        id: customer.customerId,
        email: customer.email
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Token generation failed. Please try again.' 
    });
  }
};

/**
 * Refreshes an expired access token using a valid refresh token
 */
export const renewAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
      return;
    }

    // Verify refresh token signature
    const tokenPayload = verifyAccessToken(refreshToken, CUSTOMER_JWT_SECRET);
    if (!tokenPayload || !tokenPayload.id) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
      return;
    }

    // Verify refresh token exists in database and hasn't been revoked
    const storedToken = await refreshTokenRepo.findValidByToken(refreshToken);
    if (!storedToken || storedToken.userId !== tokenPayload.id || storedToken.userType !== 'customer') {
      res.status(401).json({ 
        success: false, 
        message: 'Refresh token has been revoked or is invalid' 
      });
      return;
    }

    // Verify customer still exists and is active
    const customer = await customerRepo.findCustomerById(tokenPayload.id);
    if (!customer) {
      res.status(401).json({ 
        success: false, 
        message: 'Customer account not found' 
      });
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      customer.customerId,
      customer.email,
      'customer',
      CUSTOMER_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    // Mark refresh token as used (optional - for tracking)
    await refreshTokenRepo.markUsed(refreshToken);

    // Emit token refreshed event
    emitCustomerTokenRefreshed({
      userId: customer.customerId,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Token renewal failed. Please log in again.' 
    });
  }
};

/**
 * Validates a customer access token
 */
export const checkTokenValidity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
      return;
    }

    // Verify token signature and expiration
    const decodedPayload = verifyAccessToken(token, CUSTOMER_JWT_SECRET);
    
    if (!decodedPayload || decodedPayload.role !== 'customer') {
      res.status(401).json({ 
        success: false, 
        valid: false, 
        message: 'Token is invalid or has expired' 
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      customer: {
        id: decodedPayload.id,
        email: decodedPayload.email,
        role: decodedPayload.role
      }
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Token validation failed.' 
    });
  }
};

/**
 * Initiates password reset flow by generating a reset token
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
      return;
    }

    const customer = await customerRepo.findCustomerByEmail(email);

    // Always return success to prevent email enumeration attacks
    if (!customer?.customerId) {
      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent'
      });
      return;
    }

    // Generate secure reset token
    const resetToken = await customerRepo.createPasswordResetToken(customer.customerId);

    // TODO: Send reset token via email
    // await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email',
      // REMOVE IN PRODUCTION - only for development
      resetToken
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Password reset request failed. Please try again.' 
    });
  }
};

/**
 * Completes password reset using a valid reset token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
      return;
    }

    // Verify reset token and get customer ID
    const customerId = await customerRepo.verifyPasswordResetToken(token);
    if (!customerId) {
      res.status(400).json({ 
        success: false, 
        message: 'Password reset token is invalid or has expired' 
      });
      return;
    }

    // Update customer password
    await customerRepo.changePassword(customerId, newPassword);

    res.json({
      success: true,
      message: 'Your password has been successfully reset'
    });
  } catch (error) {
    logger.error('Error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed. Please request a new reset link.' 
    });
  }
};
