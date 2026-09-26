import type { HttpRequest, HttpResponse } from 'libs/http';


import type { CreateAttributeCommand } from '../../application/useCases/attribute/CreateAttribute';
import type { AddAttributeValueCommand } from '../../application/useCases/attribute/AddAttributeValue';
import {
  createAttributeUseCase,
  updateAttributeUseCase,
  addAttributeValueUseCase,
  removeAttributeValueUseCase,
  getAttributeValuesUseCase,
  setProductAttributeUseCase,
  setProductAttributesUseCase,
  getAssignedProductAttributesUseCase,
  removeProductAttributeUseCase,
} from '../../application/useCases/wired';
import type { SetProductAttributeCommand } from '../../application/useCases/attribute/SetProductAttribute';
import { manageAttributesUseCase } from '../../application/useCases/wired';

class AttributeController {
  // ==================== ATTRIBUTE CRUD ====================

  /**
   * GET /attributes
   * List all attributes
   */
  async listAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { groupId, searchable, filterable, forVariants } = req.query;

    let attributes;

    attributes = await manageAttributesUseCase.list({
      groupId: groupId as string | undefined,
      searchable: searchable === 'true',
      filterable: filterable === 'true',
      variant: forVariants === 'true',
    });

    res.json({
      success: true,
      data: attributes,
    });
  }

  /**
   * GET /attributes/group/:groupId
   * List attributes by group
   */
  async listAttributesByGroup(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { groupId } = req.params;
    const attributes = await manageAttributesUseCase.list({ groupId });

    res.json({
      success: true,
      data: attributes,
    });
  }

  /**
   * GET /attributes/:id
   * Get a single attribute by ID
   */
  async getAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const attribute = await manageAttributesUseCase.findById(id);

    if (!attribute) {
      res.status(404).json({
        success: false,
        error: 'Attribute not found',
      });
      return;
    }

    // Get attribute values if it's a select/radio type
    const optionTypes = ['select', 'multiselect', 'radio', 'checkbox', 'color'];
    let values: unknown[] = [];
    if (optionTypes.includes(attribute.type)) {
      values = await manageAttributesUseCase.findValues(id);
    }

    res.json({
      success: true,
      data: {
        ...attribute,
        values,
      },
    });
  }

  /**
   * GET /attributes/code/:code
   * Get a single attribute by code
   */
  async getAttributeByCode(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { code } = req.params;
    const attribute = await manageAttributesUseCase.findByCode(code);

    if (!attribute) {
      res.status(404).json({
        success: false,
        error: 'Attribute not found',
      });
      return;
    }

    res.json({
      success: true,
      data: attribute,
    });
  }

  /**
   * POST /attributes
   * Create a new attribute
   */
  async createAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    // Map attributeGroupId → groupId for backward compatibility
    const body = req.body as CreateAttributeCommand & { attributeGroupId?: string };
    if (body.attributeGroupId !== undefined && !body.groupId) {
      body.groupId = body.attributeGroupId;
    }
    const result = await createAttributeUseCase.execute(body);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  }

  /**
   * PUT /attributes/:id
   * Update an attribute
   */
  async updateAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { sortOrder, ...rest } = req.body as Record<string, unknown>;
    const result = await updateAttributeUseCase.execute({
      attributeId: id,
      ...rest,
      // Map sortOrder to position for backward compatibility
      ...(sortOrder !== undefined ? { position: sortOrder as number } : {}),
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  }

  /**
   * DELETE /attributes/:id
   * Delete an attribute
   */
  async deleteAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;

    // Check if attribute exists
    const attribute = await manageAttributesUseCase.findById(id);
    if (!attribute) {
      res.status(404).json({
        success: false,
        error: 'Attribute not found',
      });
      return;
    }

    // Prevent deleting system attributes
    if (attribute.isSystem) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete system attributes',
      });
      return;
    }

    await manageAttributesUseCase.delete(id);

    res.json({
      success: true,
      message: 'Attribute deleted successfully',
    });
  }

  // ==================== ATTRIBUTE VALUES ====================

  /**
   * GET /attributes/:id/values
   * Get all values for an attribute
   */
  async getAttributeValues(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const result = await getAttributeValuesUseCase.execute({ attributeId: id });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  }

  /**
   * POST /attributes/:id/values
   * Add a value to an attribute
   */
  async addAttributeValue(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const body = req.body as { value?: string; displayValue?: string; position?: number; isDefault?: boolean };
    const result = await addAttributeValueUseCase.execute({
      attributeId: id,
      value: body.value || '',
      displayValue: body.displayValue,
      position: body.position,
      isDefault: body.isDefault,
    } as AddAttributeValueCommand);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  }

  /**
   * DELETE /attributes/:id/values/:valueId
   * Remove a value from an attribute
   */
  async removeAttributeValue(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { valueId } = req.params;
    const result = await removeAttributeValueUseCase.execute({
      attributeValueId: valueId,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      success: true,
      message: 'Attribute value removed successfully',
    });
  }

  // ==================== PRODUCT ATTRIBUTES ====================

  /**
   * GET /products/:productId/attributes
   * Get all attributes for a product
   */
  async getProductAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { productId } = req.params;
    const result = await getAssignedProductAttributesUseCase.execute({ productId });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  }

  /**
   * POST /products/:productId/attributes
   * Set an attribute value for a product
   */
  async setProductAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { productId } = req.params;
    const body = req.body as { attributeId?: string; attributeCode?: string; value?: string };
    const result = await setProductAttributeUseCase.execute({
      productId,
      attributeId: body.attributeId,
      attributeCode: body.attributeCode,
      value: body.value || '',
    } as SetProductAttributeCommand);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  }

  /**
   * PUT /products/:productId/attributes
   * Set multiple attribute values for a product
   */
  async setProductAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { productId } = req.params;
    const { attributes, clearExisting } = req.body as {
      attributes?: Array<{ attributeId?: string; attributeCode?: string; value: string }>;
      clearExisting?: boolean;
    };

    const result = await setProductAttributesUseCase.execute({
      productId,
      attributes: attributes || [],
      clearExisting,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  }

  /**
   * DELETE /products/:productId/attributes/:attributeId
   * Remove an attribute from a product
   */
  async removeProductAttribute(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { productId, attributeId } = req.params;
    const result = await removeProductAttributeUseCase.execute({
      productId,
      attributeId,
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      success: true,
      message: 'Product attribute removed successfully',
    });
  }
}

export default new AttributeController();
