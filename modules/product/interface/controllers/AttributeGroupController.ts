import { jsonResponse } from "libs/apiResponse";
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageAttributeGroupsUseCase } from '../../application/useCases/wired';



class AttributeGroupController {
  /**
   * GET /attribute-groups
   * List all attribute groups
   */
  async listAttributeGroups(req: HttpRequest, res: HttpResponse): Promise<void> {
    const groups = await manageAttributeGroupsUseCase.findAll();

    jsonResponse(res, 200, {
            success: true,
            data: groups || [],
          });
  }

  /**
   * GET /attribute-groups/:id
   * Get a single attribute group by ID
   */
  async getAttributeGroup(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const group = await manageAttributeGroupsUseCase.findOne(id);

    if (!group) {
      jsonResponse(res, 404, {
                success: false,
                error: 'Attribute group not found',
              });
      return;
    }

    jsonResponse(res, 200, {
            success: true,
            data: group,
          });
  }

  /**
   * GET /attribute-groups/code/:code
   * Get a single attribute group by code
   */
  async getAttributeGroupByCode(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { code } = req.params;
    const group = await manageAttributeGroupsUseCase.findByCode(code);

    if (!group) {
      jsonResponse(res, 404, {
                success: false,
                error: 'Attribute group not found',
              });
      return;
    }

    jsonResponse(res, 200, {
            success: true,
            data: group,
          });
  }

  /**
   * POST /attribute-groups
   * Create a new attribute group
   */
  async createAttributeGroup(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { name, code, description, sortOrder } = req.body as { name?: string; code?: string; description?: string; sortOrder?: number };

    // Validate required fields
    if (!name || !code) {
      jsonResponse(res, 400, {
                success: false,
                error: 'Name and code are required',
              });
      return;
    }

    // Check for duplicate code
    const existing = await manageAttributeGroupsUseCase.findByCode(code);
    if (existing) {
      jsonResponse(res, 400, {
                success: false,
                error: 'Attribute group with this code already exists',
              });
      return;
    }

    const group = await manageAttributeGroupsUseCase.create({
      name,
      code,
      description: description || '',
      position: sortOrder || 0,
    });

    jsonResponse(res, 201, {
            success: true,
            data: group,
          });
  }

  /**
   * PUT /attribute-groups/:id
   * Update an attribute group
   */
  async updateAttributeGroup(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { name, description, sortOrder } = req.body as { name?: string; description?: string; sortOrder?: number };

    // Check if group exists
    const existing = await manageAttributeGroupsUseCase.findOne(id);
    if (!existing) {
      jsonResponse(res, 404, {
                success: false,
                error: 'Attribute group not found',
              });
      return;
    }

    const group = await manageAttributeGroupsUseCase.update(id, {
      name,
      description,
      position: sortOrder,
    });

    jsonResponse(res, 200, {
            success: true,
            data: group,
          });
  }

  /**
   * DELETE /attribute-groups/:id
   * Delete an attribute group
   */
  async deleteAttributeGroup(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;

    // Check if group exists
    const existing = await manageAttributeGroupsUseCase.findOne(id);
    if (!existing) {
      jsonResponse(res, 404, {
                success: false,
                error: 'Attribute group not found',
              });
      return;
    }

    await manageAttributeGroupsUseCase.delete(id);

    jsonResponse(res, 200, {
            success: true,
            message: 'Attribute group deleted successfully',
          });
  }
}

export default new AttributeGroupController();
