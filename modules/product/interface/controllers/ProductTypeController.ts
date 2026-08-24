import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import productCatalogRepository from '../../infrastructure/repositories/ProductCatalogRepository';
import productAttributeRepository from '../../infrastructure/repositories/ProductAttributeRepository';

const productTypeRepository = productCatalogRepository.types;
const productAttributeSetRepository = productAttributeRepository.sets;

export class ProductTypeController {
  /**
   * GET /product-types
   * List all product types
   */
  async listProductTypes(req: TypedRequest, res: Response): Promise<void> {
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
    
  }

  /**
   * GET /product-types/:id
   * Get a single product type by ID
   */
  async getProductType(req: TypedRequest, res: Response): Promise<void> {
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
    
  }

  /**
   * GET /product-types/slug/:slug
   * Get a single product type by slug
   */
  async getProductTypeBySlug(req: TypedRequest, res: Response): Promise<void> {
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
    
  }

  /**
   * POST /product-types
   * Create a new product type
   */
  async createProductType(req: TypedRequest, res: Response): Promise<void> {
    const { name, slug } = req.body as { name?: string; slug?: string };

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
    
  }

  /**
   * PUT /product-types/:id
   * Update a product type
   */
  async updateProductType(req: TypedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, slug } = req.body as { name?: string; slug?: string };

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
    
  }

  /**
   * DELETE /product-types/:id
   * Delete a product type
   */
  async deleteProductType(req: TypedRequest, res: Response): Promise<void> {
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
    
  }

  /**
   * GET /product-types/:id/attributes
   * Get all attributes for a product type (via attribute sets)
   */
  async getProductTypeAttributes(req: TypedRequest, res: Response): Promise<void> {
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
    
  }
}

export default new ProductTypeController();
