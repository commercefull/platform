import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import attributeSetRepo from '../../infrastructure/repositories/ProductAttributeSetRepository';

export class AttributeSetController {
  async listAttributeSets(req: TypedRequest, res: Response): Promise<void> {
    try {
      const sets = await attributeSetRepo.findAll();
      res.json({ success: true, data: sets });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getAttributeSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const set = await attributeSetRepo.findByIdWithAttributes(id);
      if (!set) {
        res.status(404).json({ success: false, error: 'Attribute set not found' });
        return;
      }
      res.json({ success: true, data: set });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createAttributeSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { name, code, description, productTypeId, isActive, isGlobal } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, error: 'Name and code are required' });
        return;
      }
      const existing = await attributeSetRepo.findByCode(code);
      if (existing) {
        res.status(400).json({ success: false, error: `Attribute set with code "${code}" already exists` });
        return;
      }
      const set = await attributeSetRepo.create({ name, code, description, productTypeId, isActive, isGlobal });
      res.status(201).json({ success: true, data: set });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateAttributeSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await attributeSetRepo.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Attribute set not found' });
        return;
      }
      const updated = await attributeSetRepo.update(id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deleteAttributeSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await attributeSetRepo.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Attribute set not found' });
        return;
      }
      await attributeSetRepo.delete(id);
      res.json({ success: true, message: 'Attribute set deleted' });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async addAttributeToSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { attributeId, position, isRequired, defaultValue } = req.body;
      if (!attributeId) {
        res.status(400).json({ success: false, error: 'attributeId is required' });
        return;
      }
      await attributeSetRepo.addAttribute({ attributeSetId: id, attributeId, position, isRequired, defaultValue });
      const updated = await attributeSetRepo.findByIdWithAttributes(id);
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async removeAttributeFromSet(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id, attributeId } = req.params;
      await attributeSetRepo.removeAttribute(id, attributeId);
      res.json({ success: true, message: 'Attribute removed from set' });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async reorderAttributes(req: TypedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { attributeIds } = req.body;
      if (!Array.isArray(attributeIds)) {
        res.status(400).json({ success: false, error: 'attributeIds must be an array' });
        return;
      }
      await attributeSetRepo.reorderAttributes(id, attributeIds);
      res.json({ success: true, message: 'Attributes reordered' });
    } catch (error) {
      logger.error('Error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new AttributeSetController();
