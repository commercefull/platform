/**
 * B2B Catalog Controller
 * Company-scoped product catalog browsing with B2B pricing
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { b2bRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: Browse product catalog with B2B pricing
 */
export const listProducts = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const page = parseInt(req.query.page as string) || 1;
    const limit = 24;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    const categoryId = req.query.category as string || '';

    let whereClause = 'WHERE p."status" = \'active\' AND p."visibility" = \'visible\'';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereClause += ` AND (p."name" ILIKE $${paramIdx} OR p."sku" ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (categoryId) {
      whereClause += ` AND p."productId" IN (SELECT "productId" FROM "productCategory" WHERE "categoryId" = $${paramIdx})`;
      params.push(categoryId);
      paramIdx++;
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM "product" p ${whereClause}`,
      params,
    );
    const total = parseInt((countResult as any)?.total || '0');

    const products = await query(
      `SELECT p."productId", p."name", p."sku", p."slug", p."shortDescription",
              p."price", p."compareAtPrice", p."currency",
              (SELECT "url" FROM "productImage" WHERE "productId" = p."productId" AND "isPrimary" = true LIMIT 1) as "imageUrl"
       FROM "product" p
       ${whereClause}
       ORDER BY p."name" ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset],
    );

    const categories = await query(
      `SELECT "categoryId", "name", "slug" FROM "category" WHERE "isActive" = true ORDER BY "sortOrder", "name"`,
      [],
    );

    const totalPages = Math.ceil(total / limit);

    b2bRespond(req, res, 'catalog/list', {
      pageName: 'Product Catalog',
      products,
      categories,
      pagination: { page, totalPages, total, limit },
      search,
      categoryId,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load catalog' });
  }
};

/**
 * GET: View product detail with B2B pricing
 */
export const viewProduct = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const { productId } = req.params;

    const product = await queryOne(
      `SELECT p.* FROM "product" p WHERE p."productId" = $1 AND p."status" = 'active'`,
      [productId],
    );

    if (!product) {
      (req as any).flash?.('error', 'Product not found');
      return res.redirect('/b2b/catalog');
    }

    const [variants, images] = await Promise.all([
      query(`SELECT * FROM "productVariant" WHERE "productId" = $1 ORDER BY "sortOrder"`, [productId]),
      query(`SELECT * FROM "productImage" WHERE "productId" = $1 ORDER BY "sortOrder"`, [productId]),
    ]);

    // Check for company-specific pricing
    const companyPricing = await query(
      `SELECT * FROM "priceListItem" pli
       JOIN "priceList" pl ON pli."priceListId" = pl."priceListId"
       WHERE pli."productId" = $1 AND pl."b2bCompanyId" = $2 AND pl."isActive" = true`,
      [productId, companyId],
    );

    b2bRespond(req, res, 'catalog/product', {
      pageName: (product as any).name,
      product,
      variants,
      images,
      companyPricing,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load product' });
  }
};
