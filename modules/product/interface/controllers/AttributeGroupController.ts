import { Request, Response } from 'express';
import { AttributeGroupRepo } from '../../repos/attributeGroupRepo';

const attributeGroupRepo = new AttributeGroupRepo();

export class AttributeGroupController {
  /**
   * GET /attribute-groups
   * List all attribute groups
   */
  async listAttributeGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await attributeGroupRepo.findAll();

      res.json({
        success: true,
        data: groups || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to list attribute groups: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /attribute-groups/:id
   * Get a single attribute group by ID
   */
  async getAttributeGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const group = await attributeGroupRepo.findOne(id);

      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Attribute group not found'
        });
        return;
      }

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get attribute group: ${(error as Error).message}`
      });
    }
  }

  /**
   * GET /attribute-groups/code/:code
   * Get a single attribute group by code
   */
  async getAttributeGroupByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const group = await attributeGroupRepo.findByCode(code);

      if (!group) {
        res.status(404).json({
          success: false,
          error: 'Attribute group not found'
        });
        return;
      }

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get attribute group: ${(error as Error).message}`
      });
    }
  }

  /**
   * POST /attribute-groups
   * Create a new attribute group
   */
  async createAttributeGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, description, sortOrder } = req.body;

      // Validate required fields
      if (!name || !code) {
        res.status(400).json({
          success: false,
          error: 'Name and code are required'
        });
        return;
      }

      // Check for duplicate code
      const existing = await attributeGroupRepo.findByCode(code);
      if (existing) {
        res.status(400).json({
          success: false,
          error: 'Attribute group with this code already exists'
        });
        return;
      }

      const group = await attributeGroupRepo.create({
        name,
        code,
        description: description || '',
        position: sortOrder || 0
      });

      res.status(201).json({
        success: true,
        data: group
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to create attribute group: ${(error as Error).message}`
      });
    }
  }

  /**
   * PUT /attribute-groups/:id
   * Update an attribute group
   */
  async updateAttributeGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, sortOrder } = req.body;

      // Check if group exists
      const existing = await attributeGroupRepo.findOne(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Attribute group not found'
        });
        return;
      }

      const group = await attributeGroupRepo.update(id, {
        name,
        description,
        position: sortOrder
      });

      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to update attribute group: ${(error as Error).message}`
      });
    }
  }

  /**
   * DELETE /attribute-groups/:id
   * Delete an attribute group
   */
  async deleteAttributeGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if group exists
      const existing = await attributeGroupRepo.findOne(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: 'Attribute group not found'
        });
        return;
      }

      await attributeGroupRepo.delete(id);

      res.json({
        success: true,
        message: 'Attribute group deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to delete attribute group: ${(error as Error).message}`
      });
    }
  }
}

export default new AttributeGroupController();
