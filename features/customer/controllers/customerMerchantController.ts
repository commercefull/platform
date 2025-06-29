import { Request, Response } from 'express';
import { CustomerRepo } from '../repos/customerRepo';

// Create a shared CustomerRepo instance to be used by all controller functions
const customerRepo = new CustomerRepo();

// ---------- Customer Methods ----------

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const customers = await customerRepo.findAllCustomers(limit, offset);
      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers'
      });
    }
  };

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await customerRepo.findCustomerById(id);
      
      if (!customer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      console.error(`Error fetching customer:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer'
      });
    }
  };

export const searchCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { term } = req.query;
      const { days = 30 } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      if (!term) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }
      
      const customers = await customerRepo.searchCustomers(term as string, limit);
      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      console.error('Error searching customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search customers'
      });
    }
  };

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        email, firstName, lastName, phone, dateOfBirth,
        isActive, isVerified, notes, metadata
      } = req.body;
      
      // Validate required fields
      if (!email || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          message: 'Required fields missing: email, firstName, and lastName are required'
        });
        return;
      }
      
      // Check if customer is already in the groups
      const existingCustomer = await customerRepo.findCustomerByEmail(email);
      if (existingCustomer) {
        res.status(400).json({
          success: false,
          message: `Email ${email} is already in use`
        });
        return;
      }
      
      const newCustomer = await customerRepo.createCustomer({
        email,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        isActive: isActive ?? true,
        isVerified: isVerified ?? false,
        notes,
        metadata
      });
      
      res.status(201).json({
        success: true,
        data: newCustomer
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer'
      });
    }
  };

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        email, firstName, lastName, phone, dateOfBirth,
        isActive, isVerified, notes, metadata
      } = req.body;
      
      const existingCustomer = await customerRepo.findCustomerById(id);
      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${id} not found`
        });
        return;
      }
      
      // If email is being changed, check if it's already in use
      if (email && email !== existingCustomer.email) {
        const customerWithEmail = await customerRepo.findCustomerByEmail(email);
        if (customerWithEmail && customerWithEmail.id !== id) {
          res.status(400).json({
            success: false,
            message: `Email ${email} is already in use`
          });
          return;
        }
      }
      
      const updatedCustomer = await customerRepo.updateCustomer(id, {
        email,
        firstName,
        lastName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        isActive,
        isVerified,
        notes,
        metadata
      });
      
      res.status(200).json({
        success: true,
        data: updatedCustomer
      });
    } catch (error: any) {
      console.error('Error updating customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer'
      });
    }
  };

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingCustomer = await customerRepo.findCustomerById(id);
      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await customerRepo.deleteCustomer(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: `Customer with ID ${id} deleted successfully`
        });
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete customer with ID ${id}`
        });
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer'
      });
    }
  };

export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingCustomer = await customerRepo.findCustomerById(id);
      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${id} not found`
        });
        return;
      }
      
      const stats = await customerRepo.getCustomerStats(id);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error fetching customer stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer statistics'
      });
    }
  };

// ---------- Customer Address Methods ----------

export const getCustomerAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      
      const addresses = await customerRepo.findCustomerAddresses(customerId);
      
      res.status(200).json({
        success: true,
        data: addresses
      });
    } catch (error: any) {
      console.error('Error fetching customer addresses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer addresses'
      });
    }
  };

export const getCustomerAddressById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const address = await customerRepo.findCustomerAddressById(id);
      
      if (!address) {
        res.status(404).json({
          success: false,
          message: `Address with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: address
      });
    } catch (error: any) {
      console.error('Error fetching customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer address'
      });
    }
  };

export const createCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const { 
        addressLine1, addressLine2, city, state, postalCode,
        country, addressType, isDefault, phone
      } = req.body;
      
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
      
      // Verify customer exists
      const customer = await customerRepo.findCustomerById(customerId);
      if (!customer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${customerId} not found`
        });
        return;
      }
      
      const newAddress = await customerRepo.createCustomerAddress({
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
    } catch (error: any) {
      console.error('Error creating customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer address'
      });
    }
  };

export const updateCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { 
        addressLine1, addressLine2, city, state, postalCode,
        country, addressType, isDefault, phone
      } = req.body;
      
      const existingAddress = await customerRepo.findCustomerAddressById(id);
      if (!existingAddress) {
        res.status(404).json({
          success: false,
          message: `Address with ID ${id} not found`
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
      
      const updatedAddress = await customerRepo.updateCustomerAddress(id, {
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
    } catch (error: any) {
      console.error('Error updating customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer address'
      });
    }
  };

export const deleteCustomerAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingAddress = await customerRepo.findCustomerAddressById(id);
      if (!existingAddress) {
        res.status(404).json({
          success: false,
          message: `Address with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await customerRepo.deleteCustomerAddress(id);
      
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
    } catch (error: any) {
      console.error('Error deleting customer address:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer address'
      });
    }
  };

  // ---------- Customer Group Methods ----------

export const getCustomerGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;
      const rawGroups = await customerRepo.findAllCustomerGroups();
      const groups = rawGroups.map(group => ({
        ...group,
        // Add any additional properties or transformations here
      }));
      
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error: any) {
      console.error('Error fetching customer groups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer groups'
      });
    }
  };

export const getCustomerGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const group = await customerRepo.findCustomerGroupById(id);
      
      if (!group) {
        res.status(404).json({
          success: false,
          message: `Customer group with ID ${id} not found`
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error: any) {
      console.error('Error fetching customer group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer group'
      });
    }
  };

export const createCustomerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, discountPercentage, isActive } = req.body;
      
      // Validate required fields
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Group name is required'
        });
        return;
      }
      
      const newGroup = await customerRepo.createCustomerGroup({
        name,
        description,
        discountPercentage,
        isActive: isActive ?? true
      });
      
      res.status(201).json({
        success: true,
        data: newGroup
      });
    } catch (error: any) {
      console.error('Error creating customer group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer group'
      });
    }
  };

export const updateCustomerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, discountPercentage, isActive } = req.body;
      
      const existingGroup = await customerRepo.findCustomerGroupById(id);
      if (!existingGroup) {
        res.status(404).json({
          success: false,
          message: `Customer group with ID ${id} not found`
        });
        return;
      }
      
      const updatedGroup = await customerRepo.updateCustomerGroup(id, {
        name,
        description,
        discountPercentage,
        isActive
      });
      
      res.status(200).json({
        success: true,
        data: updatedGroup
      });
    } catch (error: any) {
      console.error('Error updating customer group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer group'
      });
    }
  };

export const deleteCustomerGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const existingGroup = await customerRepo.findCustomerGroupById(id);
      if (!existingGroup) {
        res.status(404).json({
          success: false,
          message: `Customer group with ID ${id} not found`
        });
        return;
      }
      
      const deleted = await customerRepo.deleteCustomerGroup(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Customer group deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete customer group'
        });
      }
    } catch (error: any) {
      console.error('Error deleting customer group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer group'
      });
    }
  };

  // ---------- Customer Group Membership Methods ----------

export const getCustomersInGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId } = req.params;
      
      const existingGroup = await customerRepo.findCustomerGroupById(groupId);
      if (!existingGroup) {
        res.status(404).json({
          success: false,
          message: `Customer group with ID ${groupId} not found`
        });
        return;
      }
      
      const customers = await customerRepo.findCustomersInGroup(groupId);
      
      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      console.error('Error fetching customers in group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers in group'
      });
    }
  };

export const getCustomerGroupMemberships = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      
      const existingCustomer = await customerRepo.findCustomerById(customerId);
      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${customerId} not found`
        });
        return;
      }
      
      const memberships = await customerRepo.findCustomerGroupMemberships(customerId);
      
      // Get full group details for each membership
      const groupPromises = memberships.map(membership => 
        customerRepo.findCustomerGroupById(membership.groupId)
      );
      
      const groups = await Promise.all(groupPromises);
      
      // Filter out any null groups (shouldn't happen, but just in case)
      const validGroups = groups.filter(group => group !== null);
      
      res.status(200).json({
        success: true,
        data: validGroups
      });
    } catch (error: any) {
      console.error('Error fetching customer group memberships:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer group memberships',
        error: error.message
      });
    }
  };

export const addCustomerToGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, groupId } = req.params;
      
      // Verify customer exists
      const customer = await customerRepo.findCustomerById(customerId);
      if (!customer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${customerId} not found`
        });
        return;
      }
      
      // Verify group exists
      const group = await customerRepo.findCustomerGroupById(groupId);
      if (!group) {
        res.status(404).json({
          success: false,
          message: `Customer group with ID ${groupId} not found`
        });
        return;
      }
      
      const membership = await customerRepo.addCustomerToGroup(customerId, groupId);
      
      res.status(200).json({
        success: true,
        data: membership
      });
    } catch (error: any) {
      console.error('Error adding customer to group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add customer to group'
      });
    }
  };

export const removeCustomerFromGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, groupId } = req.params;
      
      const removed = await customerRepo.removeCustomerFromGroup(customerId, groupId);
      
      if (removed) {
        res.status(200).json({
          success: true,
          message: 'Customer removed from group successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Customer was not a member of this group'
        });
      }
    } catch (error: any) {
      console.error('Error removing customer from group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove customer from group'
      });
    }
  };

  // ---------- Customer Wishlist Methods ----------

export const getCustomerWishlists = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      
      const existingCustomer = await customerRepo.findCustomerById(customerId);
      if (!existingCustomer) {
        res.status(404).json({
          success: false,
          message: `Customer with ID ${customerId} not found`
        });
        return;
      }
      
      const wishlists = await customerRepo.findCustomerWishlists(customerId);
      
      res.status(200).json({
        success: true,
        data: wishlists
      });
    } catch (error: any) {
      console.error('Error fetching customer wishlists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer wishlists'
      });
    }
  };

export const getWishlistById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const wishlist = await customerRepo.findCustomerWishlistById(id);
      
      if (!wishlist) {
        res.status(404).json({
          success: false,
          message: `Wishlist with ID ${id} not found`
        });
        return;
      }
      
      // Get the items in the wishlist
      const items = await customerRepo.findWishlistItems(id);
      
      res.status(200).json({
        success: true,
        data: {
          ...wishlist,
          items
        }
      });
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wishlist'
      });
    }
  };

export const removeItemFromWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { wishlistId, itemId } = req.params;
      
      const item = await customerRepo.findWishlistItemById(itemId);
      if (!item) {
        res.status(404).json({
          success: false,
          message: `Wishlist item with ID ${itemId} not found`
        });
        return;
      }
      
      const removed = await customerRepo.removeItemFromWishlist(itemId);
      
      if (removed) {
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
    } catch (error: any) {
      console.error('Error removing item from wishlist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from wishlist'
      });
    }
  };

  // ---------- Customer Analytics Methods ----------

export const getNewCustomersCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const count = await customerRepo.getNewCustomersCount(days);
      
      res.status(200).json({
        success: true,
        data: {
          count,
          period: `${days} days`
        }
      });
    } catch (error: any) {
      console.error('Error fetching new customers count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch new customers count'
      });
    }
  };

export const getTopCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      try {
        const customers = await customerRepo.findAllCustomers();
        
        res.status(200).json({
          success: true,
          data: customers || []
        });
      } catch (error: any) {
        console.error('Error fetching top customers:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch top customers'
        });
      }
    } catch (error: any) {
      console.error('Error fetching top customers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top customers'
      });
    }
  };
