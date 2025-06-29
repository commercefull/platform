import { Request, Response } from 'express';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { AuthRepo } from '../repos/authRepo';
import { CustomerRepo } from '../../customer/repos/customerRepo';

// Extend the Customer interface to include password for registration
interface CustomerWithPassword {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  isVerified: boolean;
  password: string;
  lastLoginAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

// Environment variables should be properly loaded in your application
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const authRepo = new AuthRepo();
const customerRepo = new CustomerRepo();

// Token Generation and Validation Methods
const createToken = (payload: JwtPayload, secret: string, options: SignOptions): string => {
  return jwt.sign(payload, secret, options);
};

// Customer Authentication
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const customer = await authRepo.authenticateCustomer({ email, password });

    if (!customer) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Update last login timestamp
    await customerRepo.updateCustomerLoginTimestamp(customer.id);

    // Generate JWT token
    const token = createToken(
      {
        id: customer.id,
        email: customer.email,
        role: 'customer'
      },
      CUSTOMER_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name and last name are required'
      });
      return;
    }

    // Check if customer already exists
    const existingCustomer = await customerRepo.findCustomerByEmail(email);

    if (existingCustomer) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    // Hash the password
    const hashedPassword = await authRepo.hashPassword(password);

    // Create new customer
    const customerData: Omit<CustomerWithPassword, 'id' | 'createdAt' | 'updatedAt'> = {
      email,
      firstName,
      lastName,
      phone,
      isActive: true,
      isVerified: false, // Verification should be done via email
      password: hashedPassword,
      metadata: {}
    };

    // @ts-ignore - We're adding password field that will be handled separately
    const customer = await customerRepo.createCustomer(customerData);

    // Generate JWT token
    const token = createToken(
      {
        id: customer.id,
        email: customer.email,
        role: 'customer'
      },
      CUSTOMER_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration' });
  }
}

// Token generation for customers
export const generateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const customer = await authRepo.authenticateCustomer({ email, password });

    if (!customer) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Update last login timestamp
    await customerRepo.updateCustomerLoginTimestamp(customer.id);

    // Generate access token
    const accessToken = createToken(
      {
        id: customer.id,
        email: customer.email,
        role: 'customer',
        tokenType: 'access'
      },
      String(CUSTOMER_JWT_SECRET),
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    // Generate refresh token with longer expiration
    const refreshToken = createToken(
      {
        id: customer.id,
        tokenType: 'refresh'
      },
      String(CUSTOMER_JWT_SECRET),
      { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
    );

    // Store refresh token in database
    await authRepo.saveRefreshToken(customer.id, 'customer', refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      tokenType: 'Bearer',
      customer: {
        id: customer.id,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Customer token generation error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during token generation' });
  }
}

// Token refresh for customers
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
      payload = jwt.verify(refreshToken, String(CUSTOMER_JWT_SECRET)) as JwtPayload;
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    // Check token type and get customer
    if (payload.tokenType !== 'refresh' || !payload.id) {
      res.status(401).json({ success: false, message: 'Invalid token format' });
      return;
    }

    // Validate refresh token in database
    const isValidToken = await authRepo.verifyRefreshToken(payload.id, 'customer', refreshToken);
    if (!isValidToken) {
      res.status(401).json({ success: false, message: 'Refresh token has been revoked' });
      return;
    }

    const customer = await customerRepo.findCustomerById(payload.id);
    if (!customer) {
      res.status(401).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Generate new access token
    const newAccessToken = createToken(
      {
        id: customer.id,
        email: customer.email,
        role: 'customer',
        tokenType: 'access'
      },
      String(CUSTOMER_JWT_SECRET),
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: JWT_EXPIRES_IN,
      tokenType: 'Bearer'
    });
  } catch (error) {
    console.error('Customer token refresh error:', error);
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
      const decoded = jwt.verify(token, String(CUSTOMER_JWT_SECRET)) as JwtPayload;

      // Check token type and user role
      if (decoded.tokenType !== 'access' || decoded.role !== 'customer') {
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

    const customer = await customerRepo.findCustomerByEmail(email);
    userId = customer?.id;


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
