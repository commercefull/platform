import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { MerchantRepo } from '../repos/merchantRepo';
import { storefrontRespond } from '../../../web/respond';

// Define interfaces for public-facing data
interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

// Create a single instance of the repository to be shared across handlers
const merchantRepo = new MerchantRepo();

/**
 * Get active merchants for public storefront
 */
export const getActiveMerchants = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Only show active merchants to the public
    const merchants = await merchantRepo.findByStatus('active', limit);

    // For storefront API response
    if (req.headers.accept?.includes('application/json')) {
      res.status(200).json({
        success: true,
        data: merchants,
        pagination: {
          limit,
          offset,
        },
      });
      return;
    }

    // For storefront template response
    storefrontRespond(req, res, 'merchants/list', {
      title: 'Our Merchants',
      merchants,
      merchantCount: merchants.length,
    });
  } catch (error) {
    logger.error('Error:', error);

    if (req.headers.accept?.includes('application/json')) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchants',
      });
    } else {
      // Use req.flash if available
      if ('flash' in req) {
        (req as any).flash('error', 'Failed to load merchants. Please try again later.');
      }
      res.redirect('/');
    }
  }
};

/**
 * Get merchant details by ID for public storefront
 */
export const getMerchantById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const merchant = await merchantRepo.findById(id);

    if (!merchant) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(404).json({
          success: false,
          message: `Merchant not found`,
        });
      } else {
        // Use req.flash if available
        if ('flash' in req) {
          (req as any).flash('error', 'Merchant not found');
        }
        res.redirect('/merchants');
      }
      return;
    }

    // Only show active merchants to public
    if (merchant.status !== 'active') {
      if (req.headers.accept?.includes('application/json')) {
        res.status(404).json({
          success: false,
          message: `Merchant not found`,
        });
      } else {
        // Use req.flash if available
        if ('flash' in req) {
          (req as any).flash('error', 'Merchant not found');
        }
        res.redirect('/merchants');
      }
      return;
    }

    // For storefront API response
    if (req.headers.accept?.includes('application/json')) {
      // Filter out sensitive information
      const publicMerchant = {
        id: merchant.merchantId,
        name: merchant.name,
        website: merchant.website,
        logo: merchant.logo,
        description: merchant.description,
      };

      res.status(200).json({
        success: true,
        data: publicMerchant,
      });
      return;
    }

    // Get merchant's primary address for display
    const addresses = await merchantRepo.findAddressesByMerchantId(id);
    const primaryAddress = addresses.find(addr => addr.isDefault) || addresses[0];

    // For storefront template response
    storefrontRespond(req, res, 'merchants/detail', {
      title: merchant.name,
      merchant,
      primaryAddress,
    });
  } catch (error) {
    logger.error('Error:', error);

    if (req.headers.accept?.includes('application/json')) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchant details',
      });
    } else {
      // Use req.flash if available
      if ('flash' in req) {
        (req as any).flash('error', 'Failed to load merchant details. Please try again later.');
      }
      res.redirect('/merchants');
    }
  }
};

/**
 * Get merchant products
 */
export const getMerchantProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const merchant = await merchantRepo.findById(id);

    if (!merchant || merchant.status !== 'active') {
      if (req.headers.accept?.includes('application/json')) {
        res.status(404).json({
          success: false,
          message: `Merchant not found`,
        });
      } else {
        // Use req.flash if available
        if ('flash' in req) {
          (req as any).flash('error', 'Merchant not found');
        }
        res.redirect('/merchants');
      }
      return;
    }

    // Use the Product interface defined at the top level

    // Since merchantRepo doesn't have a method to get products, we'll simulate an empty response
    // In a real implementation, you would use a product repository or add this method to merchantRepo
    const products: Product[] = [];
    // TODO: Implement proper product fetching once the method is available
    // const products = await productRepo.findByMerchantId(id, limit, offset);

    // For storefront API response
    if (req.headers.accept?.includes('application/json')) {
      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          limit,
          offset,
        },
      });
      return;
    }

    // For storefront template response
    storefrontRespond(req, res, 'merchants/products', {
      title: `${merchant.name} Products`,
      merchant,
      products,
      productCount: products.length,
    });
  } catch (error) {
    logger.error('Error:', error);

    if (req.headers.accept?.includes('application/json')) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch merchant products',
      });
    } else {
      // Use req.flash if available
      if ('flash' in req) {
        (req as any).flash('error', 'Failed to load merchant products. Please try again later.');
      }
      res.redirect('/merchants');
    }
  }
};
