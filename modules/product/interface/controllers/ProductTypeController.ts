import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageProductTypesUseCase } from '../../application/useCases/wired';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  res.status(getErrorStatusCode(error)).json({ success: false, error: getErrorMessage(error) || fallback });
}

class ProductTypeController {
  /**
   * GET /product-types
   * List all product types
   */
  async listProductTypes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const productTypes = await manageProductTypesUseCase.list(req.query.active === 'true');

    res.json({
      success: true,
      data: productTypes,
    });
  }

  /**
   * GET /product-types/:id
   * Get a single product type by ID
   */
  async getProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const productType = await manageProductTypesUseCase.getByIdWithAttributeSets(req.params.id);
      res.json({
        success: true,
        data: productType,
      });
    } catch (error) {
      respondError(res, error, 'Product type not found');
    }
  }

  /**
   * GET /product-types/slug/:slug
   * Get a single product type by slug
   */
  async getProductTypeBySlug(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const productType = await manageProductTypesUseCase.getBySlug(req.params.slug);
      res.json({
        success: true,
        data: productType,
      });
    } catch (error) {
      respondError(res, error, 'Product type not found');
    }
  }

  /**
   * POST /product-types
   * Create a new product type
   */
  async createProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { name, slug } = req.body as { name?: string; slug?: string };

    try {
      const productType = await manageProductTypesUseCase.create({ name, slug });
      res.status(201).json({
        success: true,
        data: productType,
      });
    } catch (error) {
      respondError(res, error, 'Failed to create product type');
    }
  }

  /**
   * PUT /product-types/:id
   * Update a product type
   */
  async updateProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { name, slug } = req.body as { name?: string; slug?: string };

    try {
      const updated = await manageProductTypesUseCase.update(id, { name, slug });
      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      respondError(res, error, 'Product type not found');
    }
  }

  /**
   * DELETE /product-types/:id
   * Delete a product type
   */
  async deleteProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      await manageProductTypesUseCase.delete(req.params.id);
      res.json({
        success: true,
        message: 'Product type deleted successfully',
      });
    } catch (error) {
      respondError(res, error, 'Product type not found');
    }
  }

  /**
   * GET /product-types/:id/attributes
   * Get all attributes for a product type (via attribute sets)
   */
  async getProductTypeAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const attributes = await manageProductTypesUseCase.getAttributes(req.params.id);
      res.json({
        success: true,
        data: attributes,
      });
    } catch (error) {
      respondError(res, error, 'Product type not found');
    }
  }
}

export default new ProductTypeController();
