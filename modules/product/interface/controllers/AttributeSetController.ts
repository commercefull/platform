import type { HttpRequest, HttpResponse } from 'libs/http';
import { productAttributeRepository } from '../../application/wired';
import { ProductAttributeSetUpdateInput } from '../../application/wired';

const attributeSetRepo = productAttributeRepository.sets;

class AttributeSetController {
  async listAttributeSets(req: HttpRequest, res: HttpResponse): Promise<void> {
    const sets = await attributeSetRepo.findAll();
    res.json({ success: true, data: sets });
  }

  async getAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const set = await attributeSetRepo.findByIdWithAttributes(id);
    if (!set) {
      res.status(404).json({ success: false, error: 'Attribute set not found' });
      return;
    }
    res.json({ success: true, data: set });
  }

  async createAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { name, code, description, productTypeId, isActive, isGlobal } = req.body as {
      name?: string;
      code?: string;
      description?: string;
      productTypeId?: string;
      isActive?: boolean;
      isGlobal?: boolean;
    };
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
  }

  async updateAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const existing = await attributeSetRepo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Attribute set not found' });
      return;
    }
    const updated = await attributeSetRepo.update(id, req.body as ProductAttributeSetUpdateInput);
    res.json({ success: true, data: updated });
  }

  async deleteAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const existing = await attributeSetRepo.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Attribute set not found' });
      return;
    }
    await attributeSetRepo.delete(id);
    res.json({ success: true, message: 'Attribute set deleted' });
  }

  async addAttributeToSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { attributeId, position, isRequired, defaultValue } = req.body as {
      attributeId?: string;
      position?: number;
      isRequired?: boolean;
      defaultValue?: string;
    };
    if (!attributeId) {
      res.status(400).json({ success: false, error: 'attributeId is required' });
      return;
    }
    await attributeSetRepo.addAttribute({ attributeSetId: id, attributeId, position, isRequired, defaultValue });
    const updated = await attributeSetRepo.findByIdWithAttributes(id);
    res.json({ success: true, data: updated });
  }

  async removeAttributeFromSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id, attributeId } = req.params;
    await attributeSetRepo.removeAttribute(id, attributeId);
    res.json({ success: true, message: 'Attribute removed from set' });
  }

  async reorderAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { attributeIds } = req.body as { attributeIds?: string[] };
    if (!Array.isArray(attributeIds)) {
      res.status(400).json({ success: false, error: 'attributeIds must be an array' });
      return;
    }
    await attributeSetRepo.reorderAttributes(id, attributeIds);
    res.json({ success: true, message: 'Attributes reordered' });
  }
}

export default new AttributeSetController();
