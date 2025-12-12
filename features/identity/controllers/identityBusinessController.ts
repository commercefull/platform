import { Request, Response } from 'express';
import { MerchantRepo } from '../../merchant/repos/merchantRepo';
import { AuthRefreshTokenRepo } from '../repos/identityRefreshTokenRepo';
import {
  generateAccessToken,
  verifyAccessToken,
  parseExpirationDate
} from '../utils/jwtHelpers';

// Environment configuration with secure defaults
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const merchantRepo = new MerchantRepo();
const refreshTokenRepo = new AuthRefreshTokenRepo();

/**
 * Authenticates a merchant and returns a basic JWT token
 * Use this for simple session-based auth
 */
export const loginMerchant = async (req: Request, res: Response): Promise<void> => {
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

    // Authenticate merchant
    const merchant = await merchantRepo.authenticateMerchant({ email, password });
    if (!merchant) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Check merchant account status
    if (merchant.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${merchant.status}. Please contact support for assistance.`
      });
      return;
    }

    // Generate access token
    const accessToken = generateAccessToken(
      merchant.merchantId,
      merchant.email,
      'merchant',
      MERCHANT_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    res.json({
      success: true,
      accessToken,
      merchant: {
        id: merchant.merchantId,
        email: merchant.email,
        name: merchant.name,
        status: merchant.status
      }
    });
  } catch (error) {
    console.error('Merchant login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
};

/**
 * Registers a new merchant account
 * New accounts start with 'pending' status and require admin approval
 */
export const registerMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, website, description } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and business name are required'
      });
      return;
    }

    // Check for existing merchant
    const existingMerchant = await merchantRepo.findByEmail(email);
    if (existingMerchant) {
      res.status(409).json({ 
        success: false, 
        message: 'A merchant account with this email already exists' 
      });
      return;
    }

    // Create new merchant with pending status
    const newMerchant = await merchantRepo.createMerchantWithPassword({
      name,
      email,
      phone,
      website,
      logo: undefined,
      description,
      status: 'pending',
      password
    });

    res.status(201).json({
      success: true,
      message: 'Merchant account created successfully. Your account is pending approval.',
      merchant: {
        id: newMerchant.merchantId,
        email: newMerchant.email,
        name: newMerchant.name,
        status: newMerchant.status
      }
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
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

    const merchant = await merchantRepo.authenticateMerchant({ email, password });
    if (!merchant) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
      return;
    }

    // Check merchant account status
    if (merchant.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${merchant.status}. Please contact support for assistance.`
      });
      return;
    }

    // Generate access token (short-lived)
    const accessToken = generateAccessToken(
      merchant.merchantId,
      merchant.email,
      'merchant',
      MERCHANT_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    // Generate refresh token (long-lived)
    const refreshToken = generateAccessToken(
      merchant.merchantId,
      merchant.email,
      'merchant',
      MERCHANT_JWT_SECRET,
      REFRESH_TOKEN_DURATION
    );

    // Store refresh token in database for tracking/revocation
    await refreshTokenRepo.create({
      token: refreshToken,
      userType: 'merchant',
      userId: merchant.merchantId,
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
      merchant: {
        id: merchant.merchantId,
        email: merchant.email,
        name: merchant.name
      }
    });
  } catch (error) {
    console.error('Token pair generation error:', error);
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
    const tokenPayload = verifyAccessToken(refreshToken, MERCHANT_JWT_SECRET);
    if (!tokenPayload || !tokenPayload.id) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
      return;
    }

    // Verify refresh token exists in database and hasn't been revoked
    const storedToken = await refreshTokenRepo.findValidByToken(refreshToken);
    if (!storedToken || storedToken.userId !== tokenPayload.id || storedToken.userType !== 'merchant') {
      res.status(401).json({ 
        success: false, 
        message: 'Refresh token has been revoked or is invalid' 
      });
      return;
    }

    // Verify merchant still exists and is active
    const merchant = await merchantRepo.findById(tokenPayload.id);
    if (!merchant) {
      res.status(401).json({ 
        success: false, 
        message: 'Merchant account not found' 
      });
      return;
    }

    if (merchant.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${merchant.status}. Please contact support.`
      });
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(
      merchant.merchantId,
      merchant.email,
      'merchant',
      MERCHANT_JWT_SECRET,
      ACCESS_TOKEN_DURATION
    );

    // Mark refresh token as used (optional - for tracking)
    await refreshTokenRepo.markUsed(refreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION
    });
  } catch (error) {
    console.error('Token renewal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Token renewal failed. Please log in again.' 
    });
  }
};

/**
 * Validates a merchant access token
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
    const decodedPayload = verifyAccessToken(token, MERCHANT_JWT_SECRET);
    
    if (!decodedPayload || decodedPayload.role !== 'merchant') {
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
      merchant: {
        id: decodedPayload.id,
        email: decodedPayload.email,
        role: decodedPayload.role
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
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

    const merchant = await merchantRepo.findByEmail(email);

    // Always return success to prevent email enumeration attacks
    if (!merchant?.merchantId) {
      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent'
      });
      return;
    }

    // Generate secure reset token
    const resetToken = await merchantRepo.createPasswordResetToken(merchant.merchantId);

    // TODO: Send reset token via email
    // await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email',
      // REMOVE IN PRODUCTION - only for development
      resetToken
    });
  } catch (error) {
    console.error('Password reset request error:', error);
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

    // Verify reset token and get merchant ID
    const merchantId = await merchantRepo.verifyPasswordResetToken(token);
    if (!merchantId) {
      res.status(400).json({ 
        success: false, 
        message: 'Password reset token is invalid or has expired' 
      });
      return;
    }

    // Update merchant password
    await merchantRepo.changePassword(merchantId, newPassword);

    res.json({
      success: true,
      message: 'Your password has been successfully reset'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Password reset failed. Please request a new reset link.' 
    });
  }
};
