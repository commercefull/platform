import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import dynamicAttributeRepository from '../../infrastructure/repositories/DynamicAttributeRepository';
import createAttributeUseCase from '../../application/useCases/attribute/CreateAttribute';
import updateAttributeUseCase from '../../application/useCases/attribute/UpdateAttribute';
import {
  addAttributeValueUseCase,
  removeAttributeValueUseCase,
  getAttributeValuesUseCase,
} from '../../application/useCases/attribute/ManageAttributeValues';
import {
  setProductAttributeUseCase,
  setProductAttributesUseCase,
  getProductAttributesUseCase,
  removeProductAttributeUseCase,
} from '../../application/useCases/attribute/AssignProductAttributes';

export class AttributeController {
  // ==================== ATTRIBUTE CRUD ====================

  /**
   * GET /attributes
   * List all attributes
   */
  async listAttributes(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, searchable, filterable, forVariants } = req.query;

      let attributes;

      if (groupId) {
        attributes = await dynamicAttributeRepository.findAttributesByGroup(groupId as string);
      } else if (searchable === 'true') {
        attributes = await dynamicAttributeRepository.findSearchableAttributes();
      } else if (filterable === 'true') {
        attributes = await dynamicAttributeRepository.findFilterableAttributes();
      } else if (forVariants === 'true') {
        attributes = await dynamicAttributeRepository.findVariantAttributes();
      } else {
        attributes = await dynamicAttributeRepository.findAllAttributes();
      }

      res.json({
        success: true,
        data: attributes,
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to list attributes: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /attributes/:id
   * Get a single attribute by ID
   */
  async getAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const attribute = await dynamicAttributeRepository.findAttributeById(id);

      if (!attribute) {
        res.status(404).json({
          success: false,
          error: 'Attribute not found',
        });
        return;
      }

      // Get attribute values if it's a select/radio type
      const optionTypes = ['select', 'multiselect', 'radio', 'checkbox', 'color'];
      let values: any[] = [];
      if (optionTypes.includes(attribute.type)) {
        values = await dynamicAttributeRepository.findAttributeValues(id);
      }

      res.json({
        success: true,
        data: {
          ...attribute,
          values,
        },
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get attribute: ${(error as Error).message}`,
      });
    }
  }

  /**
   * GET /attributes/code/:code
   * Get a single attribute by code
   */
  async getAttributeByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const attribute = await dynamicAttributeRepository.findAttributeByCode(code);

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
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get attribute: ${(error as Error).message}`,
      });
    }
  }

  /**
   * POST /attributes
   * Create a new attribute
   */
  async createAttribute(req: Request, res: Response): Promise<void> {
    try {
      const result = await createAttributeUseCase.execute(req.body);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to create attribute: ${(error as Error).message}`,
      });
    }
  }

  /**
   * PUT /attributes/:id
   * Update an attribute
   */
  async updateAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await updateAttributeUseCase.execute({
        attributeId: id,
        ...req.body,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to update attribute: ${(error as Error).message}`,
      });
    }
  }

  /**
   * DELETE /attributes/:id
   * Delete an attribute
   */
  async deleteAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if attribute exists
      const attribute = await dynamicAttributeRepository.findAttributeById(id);
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

      await dynamicAttributeRepository.deleteAttribute(id);

      res.json({
        success: true,
        message: 'Attribute deleted successfully',
      });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to delete attribute: ${(error as Error).message}`,
      });
    }
  }

  // ==================== ATTRIBUTE VALUES ====================

  /**
   * GET /attributes/:id/values
   * Get all values for an attribute
   */
  async getAttributeValues(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await getAttributeValuesUseCase.execute({ attributeId: id });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get attribute values: ${(error as Error).message}`,
      });
    }
  }

  /**
   * POST /attributes/:id/values
   * Add a value to an attribute
   */
  async addAttributeValue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await addAttributeValueUseCase.execute({
        attributeId: id,
        ...req.body,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to add attribute value: ${(error as Error).message}`,
      });
    }
  }

  /**
   * DELETE /attributes/:id/values/:valueId
   * Remove a value from an attribute
   */
  async removeAttributeValue(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to remove attribute value: ${(error as Error).message}`,
      });
    }
  }

  // ==================== PRODUCT ATTRIBUTES ====================

  /**
   * GET /products/:productId/attributes
   * Get all attributes for a product
   */
  async getProductAttributes(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const result = await getProductAttributesUseCase.execute({ productId });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to get product attributes: ${(error as Error).message}`,
      });
    }
  }

  /**
   * POST /products/:productId/attributes
   * Set an attribute value for a product
   */
  async setProductAttribute(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const result = await setProductAttributeUseCase.execute({
        productId,
        ...req.body,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to set product attribute: ${(error as Error).message}`,
      });
    }
  }

  /**
   * PUT /products/:productId/attributes
   * Set multiple attribute values for a product
   */
  async setProductAttributes(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { attributes, clearExisting } = req.body;

      const result = await setProductAttributesUseCase.execute({
        productId,
        attributes,
        clearExisting,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to set product attributes: ${(error as Error).message}`,
      });
    }
  }

  /**
   * DELETE /products/:productId/attributes/:attributeId
   * Remove an attribute from a product
   */
  async removeProductAttribute(req: Request, res: Response): Promise<void> {
    try {
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
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({
        success: false,
        error: `Failed to remove product attribute: ${(error as Error).message}`,
      });
    }
  }
}

export default new AttributeController();
