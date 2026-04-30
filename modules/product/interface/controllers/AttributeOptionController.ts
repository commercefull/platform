import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { AttributeOptionRepo, ProductAttributeOption } from '../../infrastructure/repositories/attributeOptionRepo';

const attributeOptionRepo = new AttributeOptionRepo();

/** Expose `sortOrder` as an alias for `position` in API responses */
function mapOption(option: ProductAttributeOption): Record<string, any> {
  return { ...option, sortOrder: option.position };
}

export class AttributeOptionController {
  /**
   * GET /attribute-options/:id
   * Get a single attribute option by ID
   */
  async getAttributeOption(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Guard against literal "null" or "undefined" strings
      if (!id || id === 'null' || id === 'undefined') {
        res.status(400).json({ success: false, error: 'Invalid attribute option ID' });
        return;
      }

      const option = await attributeOptionRepo.findOne(id);

      if (!option) {
        res.status(404).json({ success: false, error: 'Attribute option not found' });
        return;
      }

      res.json({ success: true, data: mapOption(option) });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: `Failed to get attribute option: ${(error as Error).message}` });
    }
  }

  /**
   * GET /attribute-options/attribute/:attributeId
   * Get all options for an attribute
   */
  async getOptionsByAttribute(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { attributeId } = req.params;
      const options = await attributeOptionRepo.findByAttribute(attributeId);

      res.json({ success: true, data: options.map(mapOption) });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: `Failed to get attribute options: ${(error as Error).message}` });
    }
  }

  /**
   * GET /attribute-options/attribute/:attributeId/value/:value
   * Find an option by value
   */
  async getOptionByValue(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { attributeId, value } = req.params;
      const option = await attributeOptionRepo.findByValue(attributeId, value);

      if (!option) {
        res.status(404).json({ success: false, error: 'Attribute option not found' });
        return;
      }

      res.json({ success: true, data: mapOption(option) });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: `Failed to get attribute option: ${(error as Error).message}` });
    }
  }

  /**
   * POST /attribute-options
   * Create a new attribute option
   */
  async createAttributeOption(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { attributeId, value, label, sortOrder } = req.body;

      if (!attributeId || !value) {
        res.status(400).json({ success: false, error: 'attributeId and value are required' });
        return;
      }

      const option = await attributeOptionRepo.create({
        attributeId,
        value,
        label: label || value,
        position: sortOrder ?? 0,
      });

      res.status(201).json({ success: true, data: mapOption(option) });
    } catch (error) {
      logger.error('Error:', error);
      const msg = (error as Error).message;
      const status = msg.includes('duplicate key') || msg.includes('unique constraint') ? 409 : 500;
      res.status(status).json({ success: false, error: `Failed to create attribute option: ${msg}` });
    }
  }

  /**
   * PUT /attribute-options/:id
   * Update an attribute option
   */
  async updateAttributeOption(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { value, label, sortOrder } = req.body;

      const existing = await attributeOptionRepo.findOne(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Attribute option not found' });
        return;
      }

      const updated = await attributeOptionRepo.update(id, {
        value,
        label,
        position: sortOrder,
      });

      res.json({ success: true, data: mapOption(updated as ProductAttributeOption) });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: `Failed to update attribute option: ${(error as Error).message}` });
    }
  }

  /**
   * DELETE /attribute-options/:id
   * Delete an attribute option
   */
  async deleteAttributeOption(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await attributeOptionRepo.findOne(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Attribute option not found' });
        return;
      }

      await attributeOptionRepo.delete(id);

      res.json({ success: true, message: 'Attribute option deleted successfully' });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: `Failed to delete attribute option: ${(error as Error).message}` });
    }
  }
}

export default new AttributeOptionController();
