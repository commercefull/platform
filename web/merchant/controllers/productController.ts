/**
 * Merchant Product Controller
 * Manages products with merchant isolation
 */

import { Request, Response } from 'express';
import { merchantRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

interface MerchantUser {
  id: string;
  merchantId: string;
  email: string;
  name: string;
}

/**
 * GET: List merchant's products
 */
export const listProducts = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const { status, search, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = 'WHERE p."merchantId" = $1 AND p."deletedAt" IS NULL';
    const params: any[] = [user.merchantId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND p."status" = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (p."name" ILIKE $${paramIndex} OR p."sku" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "product" p ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    params.push(limit, offset);
    const products = await query<any[]>(
      `SELECT p."productId", p."name", p."sku", p."status", p."price", 
              p."createdAt", p."updatedAt",
              COALESCE(il."quantity" - il."reserved", 0) as "stockQuantity"
       FROM "product" p
       LEFT JOIN "inventoryLevel" il ON p."productId" = il."productId"
       ${whereClause}
       ORDER BY p."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page as string);

    merchantRespond(req, res, 'products/index', {
      pageName: 'My Products',
      products: products || [],
      pagination: {
        total,
        page: currentPage,
        pages,
        hasNext: currentPage < pages,
        hasPrev: currentPage > 1,
      },
      filters: { status, search },
    });
  } catch (error) {
    console.error('Merchant products error:', error);
    merchantRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load products',
      user: req.user,
    });
  }
};

/**
 * GET: View single product
 */
export const viewProduct = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const { productId } = req.params;

    const product = await queryOne<any>(
      `SELECT p.*, 
              COALESCE(il."quantity", 0) as "stockQuantity",
              COALESCE(il."reserved", 0) as "reserved"
       FROM "product" p
       LEFT JOIN "inventoryLevel" il ON p."productId" = il."productId"
       WHERE p."productId" = $1 AND p."merchantId" = $2 AND p."deletedAt" IS NULL`,
      [productId, user.merchantId]
    );

    if (!product) {
      return merchantRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Product not found',
        user,
      });
    }

    merchantRespond(req, res, 'products/view', {
      pageName: product.name,
      user,
      product,
    });
  } catch (error) {
    console.error('Merchant view product error:', error);
    merchantRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load product',
      user: req.user,
    });
  }
};

/**
 * GET: Create product form
 */
export const createProductForm = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    // Get categories for dropdown
    const categories = await query<any[]>(
      `SELECT "categoryId", "name" FROM "category" WHERE "deletedAt" IS NULL ORDER BY "name"`
    );

    merchantRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      user,
      categories: categories || [],
    });
  } catch (error) {
    console.error('Merchant create product form error:', error);
    merchantRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load form',
      user: req.user,
    });
  }
};

/**
 * GET: Edit product form
 */
export const editProductForm = async (req: Request, res: Response) => {
  try {
    const user = req.user as MerchantUser;
    if (!user?.merchantId) {
      return res.redirect('/merchant/login');
    }

    const { productId } = req.params;

    const product = await queryOne<any>(
      `SELECT * FROM "product" 
       WHERE "productId" = $1 AND "merchantId" = $2 AND "deletedAt" IS NULL`,
      [productId, user.merchantId]
    );

    if (!product) {
      return merchantRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Product not found',
        user,
      });
    }

    const categories = await query<any[]>(
      `SELECT "categoryId", "name" FROM "category" WHERE "deletedAt" IS NULL ORDER BY "name"`
    );

    merchantRespond(req, res, 'products/edit', {
      pageName: `Edit: ${product.name}`,
      user,
      product,
      categories: categories || [],
    });
  } catch (error) {
    console.error('Merchant edit product form error:', error);
    merchantRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load product',
      user: req.user,
    });
  }
};
