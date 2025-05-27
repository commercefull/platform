import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRepo } from '../repos/authRepo';
import { CustomerRepo } from '../../customer/repos/customerRepo';
import { MerchantRepo } from '../../merchant/repos/merchantRepo';

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
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthController {
  private authRepo: AuthRepo;
  private customerRepo: CustomerRepo;
  private merchantRepo: MerchantRepo;

  constructor() {
    this.authRepo = new AuthRepo();
    this.customerRepo = new CustomerRepo();
    this.merchantRepo = new MerchantRepo();
  }

  // Customer Authentication
  async customerLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const customer = await this.authRepo.authenticateCustomer({ email, password });

      if (!customer) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      // Update last login timestamp
      await this.customerRepo.updateCustomerLoginTimestamp(customer.id);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email,
          role: 'customer'
        },
        String(JWT_SECRET),
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

  async customerRegister(req: Request, res: Response): Promise<void> {
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
      const existingCustomer = await this.customerRepo.findCustomerByEmail(email);
      
      if (existingCustomer) {
        res.status(409).json({ success: false, message: 'Email is already registered' });
        return;
      }

      // Hash the password
      const hashedPassword = await this.authRepo.hashPassword(password);

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
      const customer = await this.customerRepo.createCustomer(customerData);

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email,
          role: 'customer'
        },
        String(JWT_SECRET),
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

  // Merchant Authentication
  async merchantLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required' });
        return;
      }

      const merchant = await this.authRepo.authenticateMerchant({ email, password });

      if (!merchant) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      // Get merchant details
      const merchantDetails = await this.merchantRepo.findById(merchant.id);
      
      if (!merchantDetails) {
        res.status(404).json({ success: false, message: 'Merchant account not found' });
        return;
      }

      // Check if merchant is active
      if (merchantDetails.status !== 'active') {
        res.status(403).json({ 
          success: false, 
          message: 'Your merchant account is not active. Please contact support.' 
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: merchant.id, 
          email: merchant.email,
          role: 'merchant'
        },
        String(JWT_SECRET),
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );

      res.json({
        success: true,
        token,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          name: merchantDetails.name,
          status: merchantDetails.status
        }
      });
    } catch (error) {
      console.error('Merchant login error:', error);
      res.status(500).json({ success: false, message: 'An error occurred during login' });
    }
  }

  async merchantRegister(req: Request, res: Response): Promise<void> {
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
      const existingMerchant = await this.merchantRepo.findByEmail(email);
      
      if (existingMerchant) {
        res.status(409).json({ success: false, message: 'Email is already registered' });
        return;
      }

      // Hash the password
      const hashedPassword = await this.authRepo.hashPassword(password);

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
      const merchant = await this.merchantRepo.create(merchantData);

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

  // Password Reset
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
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

      // Find user based on type
      if (userType === 'customer') {
        const customer = await this.customerRepo.findCustomerByEmail(email);
        userId = customer?.id;
      } else if (userType === 'merchant') {
        const merchant = await this.merchantRepo.findByEmail(email);
        userId = merchant?.id;
      } else {
        // Admin case - would need AdminRepo
        // const admin = await this.adminRepo.findByEmail(email);
        // userId = admin?.id;
      }

      if (!userId) {
        // Still return success to avoid leaking information about registered emails
        res.json({ 
          success: true, 
          message: 'If an account with that email exists, a password reset link has been sent' 
        });
        return;
      }

      // Generate and store reset token
      const resetToken = await this.authRepo.createPasswordResetToken(userId, userType);

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

  async resetPassword(req: Request, res: Response): Promise<void> {
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
      const userId = await this.authRepo.verifyPasswordResetToken(token, userType);

      if (!userId) {
        res.status(400).json({ success: false, message: 'Invalid or expired token' });
        return;
      }

      // Change password
      await this.authRepo.changePassword(userId, newPassword, userType);

      res.json({
        success: true,
        message: 'Password has been successfully reset'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ success: false, message: 'An error occurred resetting your password' });
    }
  }
}
