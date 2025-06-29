import { Request, Response } from 'express';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { AuthRepo } from '../repos/authRepo';
import { MerchantRepo } from '../../merchant/repos/merchantRepo';

// Extend the Merchant interface to include password for registration
interface MerchantWithPassword {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  password: string;
}

// Environment variables should be properly loaded in your application
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const authRepo = new AuthRepo();
const merchantRepo = new MerchantRepo();

// Token Generation and Validation Methods
const createToken = (payload: JwtPayload, secret: string, options: SignOptions): string => {
  return jwt.sign(payload, secret, options);
}

const validateToken = (token: string, secret: string): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return null;
  }
}

// Merchant Authentication
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const merchant = await authRepo.authenticateMerchant({ email, password });

    if (!merchant) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Check if merchant is active
    if (merchant.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${merchant.status}. Please contact support.`
      });
      return;
    }

    // Generate JWT token
    const token = createToken(
      {
        id: merchant.id,
        email: merchant.email,
        role: 'merchant'
      },
      MERCHANT_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      success: true,
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        status: merchant.status
      }
    });
  } catch (error) {
    console.error('Merchant login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, website, description } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and merchant name are required'
      });
      return;
    }

    // Check if merchant already exists
    const existingMerchant = await merchantRepo.findByEmail(email);

    if (existingMerchant) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    // Hash the password
    const hashedPassword = await authRepo.hashPassword(password);

    // Create new merchant with pending status (requires admin approval)
    const merchantData: MerchantWithPassword = {
      name,
      email,
      phone,
      website,
      description,
      status: 'pending', // New merchants start with pending status
      password: hashedPassword
    };

    // @ts-ignore - We're adding password field that will be handled separately
    const merchant = await merchantRepo.create(merchantData);

    res.status(201).json({
      success: true,
      message: 'Merchant account created and pending approval',
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        status: merchant.status
      }
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration' });
  }
}

// Token generation for merchants
export const generateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const merchant = await authRepo.authenticateMerchant({ email, password });

    if (!merchant) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (merchant.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${merchant.status}. Please contact support.`
      });
      return;
    }

    // Generate access token
    const accessToken = createToken(
      {
        id: merchant.id,
        email: merchant.email,
        role: 'merchant',
        tokenType: 'access'
      },
      String(MERCHANT_JWT_SECRET),
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    // Generate refresh token with longer expiration
    const refreshToken = createToken(
      {
        id: merchant.id,
        tokenType: 'refresh'
      },
      String(MERCHANT_JWT_SECRET),
      { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
    );

    // Store refresh token in database
    await authRepo.saveRefreshToken(merchant.id, 'merchant', refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      tokenType: 'Bearer',
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name
      }
    });
  } catch (error) {
    console.error('Merchant token generation error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during token generation' });
  }
}

// Token refresh for merchants
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    // Verify the refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, String(MERCHANT_JWT_SECRET)) as JwtPayload;
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    // Check token type and get merchant
    if (payload.tokenType !== 'refresh' || !payload.id) {
      res.status(401).json({ success: false, message: 'Invalid token format' });
      return;
    }

    // Validate refresh token in database
    const isValidToken = await authRepo.verifyRefreshToken(payload.id, 'merchant', refreshToken);
    if (!isValidToken) {
      res.status(401).json({ success: false, message: 'Refresh token has been revoked' });
      return;
    }

    const merchant = await merchantRepo.findById(payload.id);
    if (!merchant) {
      res.status(401).json({ success: false, message: 'Merchant not found' });
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
    const newAccessToken = createToken(
      {
        id: merchant.id,
        email: merchant.email,
        role: 'merchant',
        tokenType: 'access'
      },
      String(MERCHANT_JWT_SECRET),
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: JWT_EXPIRES_IN,
      tokenType: 'Bearer'
    });
  } catch (error) {
    console.error('Merchant token refresh error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during token refresh' });
  }
}

// Token validation endpoint
export const validateTokenEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Token is required' });
      return;
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, String(MERCHANT_JWT_SECRET)) as JwtPayload;

      // Check token type and user role
      if (decoded.tokenType !== 'access' || decoded.role !== 'merchant') {
        res.status(401).json({ success: false, message: 'Invalid token type or role' });
        return;
      }

      res.json({
        success: true,
        valid: true,
        decoded: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    } catch (err) {
      res.status(401).json({ success: false, valid: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during token validation' });
  }
}

// Password Reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      res.status(400).json({ success: false, message: 'Email and user type are required' });
      return;
    }

    if (!['customer', 'merchant', 'admin'].includes(userType)) {
      res.status(400).json({ success: false, message: 'Invalid user type' });
      return;
    }

    let userId;

    const merchant = await merchantRepo.findByEmail(email);
    userId = merchant?.id;

    if (!userId) {
      // Still return success to avoid leaking information about registered emails
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
      return;
    }

    // Generate and store reset token
    const resetToken = await authRepo.createPasswordResetToken(userId, userType);

    // In a real application, send this token via email
    // await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // For development purposes only - remove in production
      resetToken
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ success: false, message: 'An error occurred processing your request' });
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword || !userType) {
      res.status(400).json({
        success: false,
        message: 'Token, new password and user type are required'
      });
      return;
    }

    // Verify token and get user ID
    const userId = await authRepo.verifyPasswordResetToken(token, userType);

    if (!userId) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    // Change password
    await authRepo.changePassword(userId, newPassword, userType);

    res.json({
      success: true,
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'An error occurred resetting your password' });
  }
}
