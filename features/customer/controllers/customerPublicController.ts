import { Request, Response } from 'express';
import { CustomerRepo } from '../repos/customerRepo';

export class CustomerPublicController {
  private customerRepo: CustomerRepo;

  constructor() {
    this.customerRepo = new CustomerRepo();
  }

  // Get customer profile
  getCustomerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const customer = await this.customerRepo.findCustomerById(customerId);
      
      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }
      
      // Filter out sensitive data for public-facing API
      const profile = {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        dateOfBirth: customer.dateOfBirth,
        isVerified: customer.isVerified,
        createdAt: customer.createdAt
      };
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer profile'
      });
    }
  };

  // Update customer profile
  updateCustomerProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      const { firstName, lastName, phone, dateOfBirth } = req.body;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const customer = await this.customerRepo.findCustomerById(customerId);
      
      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }
      
      // Email changes would typically be handled through a separate verification flow
      const updatedCustomer = await this.customerRepo.updateCustomer(customerId, {
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      });
      
      // Filter out sensitive data for response
      const profile = {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        phone: updatedCustomer.phone,
        dateOfBirth: updatedCustomer.dateOfBirth,
        isVerified: updatedCustomer.isVerified,
        createdAt: updatedCustomer.createdAt
      };
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer profile'
      });
    }
  };

  // Register a new customer
  registerCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, firstName, lastName, password, phone } = req.body;
      
      // Validate required fields
      if (!email || !firstName || !lastName || !password) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: email, firstName, lastName, and password are required'
        });
        return;
      }
      
      // Check if email is already in use
      const existingCustomer = await this.customerRepo.findCustomerByEmail(email);
      if (existingCustomer) {
        res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
        return;
      }
      
      // In a real implementation, password would be hashed and stored separately
      // Here we're just creating the customer record
      const newCustomer = await this.customerRepo.createCustomer({
        email,
        firstName,
        lastName,
        phone,
        isActive: true,
        isVerified: false, // Would typically require email verification
        notes: 'Registered through public API',
        metadata: { registrationSource: 'website' }
      });
      
      // Filter out sensitive data for response
      const profile = {
        id: newCustomer.id,
        email: newCustomer.email,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        phone: newCustomer.phone,
        isVerified: newCustomer.isVerified,
        createdAt: newCustomer.createdAt
      };
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: profile
      });
    } catch (error) {
      console.error('Error registering customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register customer'
      });
    }
  };

  // Customer address management
  getCustomerAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const addresses = await this.customerRepo.findCustomerAddresses(customerId);
      
      res.status(200).json({
        success: true,
        data: addresses
      });
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer addresses'
      });
    }
  };

  addCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      const { 
        addressLine1, addressLine2, city, state, postalCode,
        country, addressType, isDefault, phone
      } = req.body;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      // Validate required fields
      if (!addressLine1 || !city || !state || !postalCode || !country || !addressType) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: addressLine1, city, state, postalCode, country, and addressType are required'
        });
        return;
      }
      
      // Validate address type
      if (addressType !== 'billing' && addressType !== 'shipping') {
        res.status(400).json({
          success: false,
          message: 'Address type must be either "billing" or "shipping"'
        });
        return;
      }
      
      const customer = await this.customerRepo.findCustomerById(customerId);
      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }
      
      const newAddress = await this.customerRepo.createCustomerAddress({
        customerId,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefault: isDefault ?? false,
        phone
      });
      
      res.status(201).json({
        success: true,
        data: newAddress
      });
    } catch (error) {
      console.error('Error adding customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add customer address'
      });
    }
  };

  updateCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the address belongs to the authenticated user
      const { id } = req.params;
      const { 
        addressLine1, addressLine2, city, state, postalCode,
        country, addressType, isDefault, phone
      } = req.body;
      
      const address = await this.customerRepo.findCustomerAddressById(id);
      if (!address) {
        res.status(404).json({
          success: false,
          message: 'Address not found'
        });
        return;
      }
      
      // Validate address type if provided
      if (addressType && addressType !== 'billing' && addressType !== 'shipping') {
        res.status(400).json({
          success: false,
          message: 'Address type must be either "billing" or "shipping"'
        });
        return;
      }
      
      const updatedAddress = await this.customerRepo.updateCustomerAddress(id, {
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        addressType,
        isDefault,
        phone
      });
      
      res.status(200).json({
        success: true,
        data: updatedAddress
      });
    } catch (error) {
      console.error('Error updating customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer address'
      });
    }
  };

  deleteCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the address belongs to the authenticated user
      const { id } = req.params;
      
      const address = await this.customerRepo.findCustomerAddressById(id);
      if (!address) {
        res.status(404).json({
          success: false,
          message: 'Address not found'
        });
        return;
      }
      
      const deleted = await this.customerRepo.deleteCustomerAddress(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Address deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete address'
        });
      }
    } catch (error) {
      console.error('Error deleting customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer address'
      });
    }
  };

  // Customer wishlist management
  getCustomerWishlists = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      const wishlists = await this.customerRepo.findCustomerWishlists(customerId);
      
      // For each wishlist, get the items
      const populatedWishlists = await Promise.all(
        wishlists.map(async (wishlist) => {
          const items = await this.customerRepo.findWishlistItems(wishlist.id);
          return {
            ...wishlist,
            items
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: populatedWishlists
      });
    } catch (error) {
      console.error('Error fetching customer wishlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer wishlists'
      });
    }
  };

  createWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would get customerId from authenticated user session
      const { customerId } = req.params;
      const { name, isPublic } = req.body;
      
      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }
      
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Wishlist name is required'
        });
        return;
      }
      
      const customer = await this.customerRepo.findCustomerById(customerId);
      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }
      
      const newWishlist = await this.customerRepo.createCustomerWishlist({
        customerId,
        name,
        isPublic: isPublic ?? false
      });
      
      res.status(201).json({
        success: true,
        data: {
          ...newWishlist,
          items: []
        }
      });
    } catch (error) {
      console.error('Error creating wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create wishlist'
      });
    }
  };

  updateWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the wishlist belongs to the authenticated user
      const { id } = req.params;
      const { name, isPublic } = req.body;
      
      const wishlist = await this.customerRepo.findCustomerWishlistById(id);
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
        return;
      }
      
      const updatedWishlist = await this.customerRepo.updateCustomerWishlist(id, {
        name,
        isPublic
      });
      
      const items = await this.customerRepo.findWishlistItems(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...updatedWishlist,
          items
        }
      });
    } catch (error) {
      console.error('Error updating wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update wishlist'
      });
    }
  };

  deleteWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the wishlist belongs to the authenticated user
      const { id } = req.params;
      
      const wishlist = await this.customerRepo.findCustomerWishlistById(id);
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
        return;
      }
      
      const deleted = await this.customerRepo.deleteCustomerWishlist(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Wishlist deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete wishlist'
        });
      }
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete wishlist'
      });
    }
  };

  addItemToWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the wishlist belongs to the authenticated user
      const { wishlistId } = req.params;
      const { productId, variantId, note } = req.body;
      
      if (!productId) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
        return;
      }
      
      const wishlist = await this.customerRepo.findCustomerWishlistById(wishlistId);
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
        return;
      }
      
      const now = new Date();
      const newItem = await this.customerRepo.addItemToWishlist({
        wishlistId,
        productId,
        variantId,
        addedAt: now,
        note
      });
      
      res.status(201).json({
        success: true,
        data: newItem
      });
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to wishlist'
      });
    }
  };

  removeItemFromWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, we would verify that the wishlist item belongs to the authenticated user
      const { id } = req.params;
      
      const item = await this.customerRepo.findWishlistItemById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Wishlist item not found'
        });
        return;
      }
      
      const deleted = await this.customerRepo.removeItemFromWishlist(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Item removed from wishlist successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to remove item from wishlist'
        });
      }
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from wishlist'
      });
    }
  };

  // Get public wishlist (if shared)
  getPublicWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const wishlist = await this.customerRepo.findCustomerWishlistById(id);
      
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: 'Wishlist not found'
        });
        return;
      }
      
      // Only return if the wishlist is public
      if (!wishlist.isPublic) {
        res.status(403).json({
          success: false,
          message: 'This wishlist is not public'
        });
        return;
      }
      
      const items = await this.customerRepo.findWishlistItems(id);
      
      // Get customer info (for public display only)
      const customer = await this.customerRepo.findCustomerById(wishlist.customerId);
      const customerInfo = customer ? {
        firstName: customer.firstName,
        lastName: customer.lastName.charAt(0) + '.' // Show only first initial of last name for privacy
      } : null;
      
      res.status(200).json({
        success: true,
        data: {
          id: wishlist.id,
          name: wishlist.name,
          customer: customerInfo,
          createdAt: wishlist.createdAt,
          items
        }
      });
    } catch (error) {
      console.error('Error fetching public wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlist'
      });
    }
  };
}
