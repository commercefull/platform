import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import productTypeRepository from '../../infrastructure/repositories/ProductTypeRepository';
import productAttributeSetRepository from '../../infrastructure/repositories/ProductAttributeSetRepository';

export class ProductTypeController {
  /**
   * GET /product-types
   * List all product types
   */
  async listProductTypes(req: Request, res: Response): Promise<void> {
    try {
      const { active } = req.query;

      let productTypes;
      if (active === 'true') {
        productTypes = await productTypeRepository.findActive();
      } else {
        productTypes = await productTypeRepository.findAll();
      }

      res.json({
        success: true,
        data: productTypes,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to list product types: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /product-types/:id
   * Get a single product type by ID
   */
  async getProductType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const productType = await productTypeRepository.findById(id);

      if (!productType) {
        res.status(404).json({
          success: false,
          error: 'Product type not found',
        });
        return;
      }

      // Get attribute sets for this product type
      const attributeSets = await productAttributeSetRepository.findByProductType(id);

      res.json({
        success: true,
        data: {
          ...productType,
          attributeSets,
        },
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get product type: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /product-types/slug/:slug
   * Get a single product type by slug
   */
  async getProductTypeBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const productType = await productTypeRepository.findBySlug(slug);

      if (!productType) {
        res.status(404).json({
          success: false,
          error: 'Product type not found',
        });
        return;
      }

      res.json({
        success: true,
        data: productType,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get product type: ${(error as Error).message}`,
      });
    }
  }

  /**
   * POST /product-types
   * Create a new product type
   */
  async createProductType(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Name is required',
        });
        return;
      }

      // Check if slug already exists
      const checkSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = await productTypeRepository.findBySlug(checkSlug);
      if (existing) {
        res.status(400).json({
          success: false,
          error: `Product type with slug "${checkSlug}" already exists`,
        });
        return;
      }

      const productType = await productTypeRepository.create({
        name,
        slug,
      });

      res.status(201).json({
        success: true,
        data: productType,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to create product type: ${(error as Error).message}`,
      });
    }
  }

  /**
   * PUT /product-types/:id
   * Update a product type
   */
  async updateProductType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, slug } = req.body;

      const existing = await productTypeRepository.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Product type not found',
        });
        return;
      }

      // Check if new slug conflicts
      if (slug && slug !== existing.slug) {
        const slugExists = await productTypeRepository.findBySlug(slug);
        if (slugExists) {
          res.status(400).json({
            success: false,
            error: `Product type with slug "${slug}" already exists`,
          });
          return;
        }
      }

      const updated = await productTypeRepository.update(id, {
        name,
        slug,
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to update product type: ${(error as Error).message}`,
      });
    }
  }

  /**
   * DELETE /product-types/:id
   * Delete a product type
   */
  async deleteProductType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await productTypeRepository.findById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Product type not found',
        });
        return;
      }

      await productTypeRepository.delete(id);

      res.json({
        success: true,
        message: 'Product type deleted successfully',
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to delete product type: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /product-types/:id/attributes
   * Get all attributes for a product type (via attribute sets)
   */
  async getProductTypeAttributes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const productType = await productTypeRepository.findById(id);
      if (!productType) {
        res.status(404).json({
          success: false,
          error: 'Product type not found',
        });
        return;
      }

      const attributes = await productAttributeSetRepository.getAttributesForProductType(id);

      res.json({
        success: true,
        data: attributes,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get product type attributes: ${(error as Error).message}`,
      });
    }
  }
}

export default new ProductTypeController();
