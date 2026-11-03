import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageProductTypesUseCase } from '../../application/useCases/wired';

class ProductTypeController {
  /**
   * GET /product-types
   * List all product types
   */
  async listProductTypes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const productTypes = await manageProductTypesUseCase.list(req.query.active === 'true');

    jsonResponse(res, 200, {
      success: true,
      data: productTypes,
    });
  }

  /**
   * GET /product-types/:id
   * Get a single product type by ID
   */
  async getProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    const productType = await manageProductTypesUseCase.getByIdWithAttributeSets(req.params.id);
    jsonResponse(res, 200, {
      success: true,
      data: productType,
    });
  }

  /**
   * GET /product-types/slug/:slug
   * Get a single product type by slug
   */
  async getProductTypeBySlug(req: HttpRequest, res: HttpResponse): Promise<void> {
    const productType = await manageProductTypesUseCase.getBySlug(req.params.slug);
    jsonResponse(res, 200, {
      success: true,
      data: productType,
    });
  }

  /**
   * POST /product-types
   * Create a new product type
   */
  async createProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { name, slug } = req.body as { name?: string; slug?: string };

    const productType = await manageProductTypesUseCase.create({ name, slug });
    jsonResponse(res, 201, {
      success: true,
      data: productType,
    });
  }

  /**
   * PUT /product-types/:id
   * Update a product type
   */
  async updateProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { name, slug } = req.body as { name?: string; slug?: string };

    const updated = await manageProductTypesUseCase.update(id, { name, slug });
    jsonResponse(res, 200, {
      success: true,
      data: updated,
    });
  }

  /**
   * DELETE /product-types/:id
   * Delete a product type
   */
  async deleteProductType(req: HttpRequest, res: HttpResponse): Promise<void> {
    await manageProductTypesUseCase.delete(req.params.id);
    jsonResponse(res, 200, {
      success: true,
      message: 'Product type deleted successfully',
    });
  }

  /**
   * GET /product-types/:id/attributes
   * Get all attributes for a product type (via attribute sets)
   */
  async getProductTypeAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const attributes = await manageProductTypesUseCase.getAttributes(req.params.id);
    jsonResponse(res, 200, {
      success: true,
      data: attributes,
    });
  }
}

export default new ProductTypeController();
