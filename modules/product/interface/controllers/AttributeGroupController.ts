import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import productAttributeRepository from '../../infrastructure/repositories/ProductAttributeRepository';

const attributeGroupRepo = productAttributeRepository.groups;

export class AttributeGroupController {
  /**
   * GET /attribute-groups
   * List all attribute groups
   */
  async listAttributeGroups(req: TypedRequest, res: Response): Promise<void> {
    const groups = await attributeGroupRepo.findAll();

    res.json({
      success: true,
      data: groups || [],
    });
    
  }

  /**
   * GET /attribute-groups/:id
   * Get a single attribute group by ID
   */
  async getAttributeGroup(req: TypedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const group = await attributeGroupRepo.findOne(id);

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Attribute group not found',
      });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
    
  }

  /**
   * GET /attribute-groups/code/:code
   * Get a single attribute group by code
   */
  async getAttributeGroupByCode(req: TypedRequest, res: Response): Promise<void> {
    const { code } = req.params;
    const group = await attributeGroupRepo.findByCode(code);

    if (!group) {
      res.status(404).json({
        success: false,
        error: 'Attribute group not found',
      });
      return;
    }

    res.json({
      success: true,
      data: group,
    });
    
  }

  /**
   * POST /attribute-groups
   * Create a new attribute group
   */
  async createAttributeGroup(req: TypedRequest, res: Response): Promise<void> {
    const { name, code, description, sortOrder } = req.body as { name?: string; code?: string; description?: string; sortOrder?: number };

    // Validate required fields
    if (!name || !code) {
      res.status(400).json({
        success: false,
        error: 'Name and code are required',
      });
      return;
    }

    // Check for duplicate code
    const existing = await attributeGroupRepo.findByCode(code);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'Attribute group with this code already exists',
      });
      return;
    }

    const group = await attributeGroupRepo.create({
      name,
      code,
      description: description || '',
      position: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
    
  }

  /**
   * PUT /attribute-groups/:id
   * Update an attribute group
   */
  async updateAttributeGroup(req: TypedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, description, sortOrder } = req.body as { name?: string; description?: string; sortOrder?: number };

    // Check if group exists
    const existing = await attributeGroupRepo.findOne(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Attribute group not found',
      });
      return;
    }

    const group = await attributeGroupRepo.update(id, {
      name,
      description,
      position: sortOrder,
    });

    res.json({
      success: true,
      data: group,
    });
    
  }

  /**
   * DELETE /attribute-groups/:id
   * Delete an attribute group
   */
  async deleteAttributeGroup(req: TypedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    // Check if group exists
    const existing = await attributeGroupRepo.findOne(id);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Attribute group not found',
      });
      return;
    }

    await attributeGroupRepo.delete(id);

    res.json({
      success: true,
      message: 'Attribute group deleted successfully',
    });
    
  }
}

export default new AttributeGroupController();
