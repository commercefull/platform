import { jsonResponse } from "libs/apiResponse";
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageAttributeSetsUseCase } from '../../application/useCases/wired';
import { AttributeSetCreateInput, AttributeSetUpdateInput } from '../../application/useCases/ManageAttributeSets';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';

function respondError(res: HttpResponse, error: unknown, fallback: string): void {
  jsonResponse(res, getErrorStatusCode(error), { success: false, error: getErrorMessage(error) || fallback });
}

class AttributeSetController {
  async listAttributeSets(req: HttpRequest, res: HttpResponse): Promise<void> {
    const sets = await manageAttributeSetsUseCase.list();
    jsonResponse(res, 200, { success: true, data: sets });
  }

  async getAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const set = await manageAttributeSetsUseCase.getByIdWithAttributes(req.params.id);
      jsonResponse(res, 200, { success: true, data: set });
    } catch (error) {
      respondError(res, error, 'Attribute set not found');
    }
  }

  async createAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const set = await manageAttributeSetsUseCase.create(req.body as AttributeSetCreateInput);
      jsonResponse(res, 201, { success: true, data: set });
    } catch (error) {
      respondError(res, error, 'Failed to create attribute set');
    }
  }

  async updateAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const updated = await manageAttributeSetsUseCase.update(req.params.id, req.body as AttributeSetUpdateInput);
      jsonResponse(res, 200, { success: true, data: updated });
    } catch (error) {
      respondError(res, error, 'Attribute set not found');
    }
  }

  async deleteAttributeSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      await manageAttributeSetsUseCase.delete(req.params.id);
      jsonResponse(res, 200, { success: true, message: 'Attribute set deleted' });
    } catch (error) {
      respondError(res, error, 'Attribute set not found');
    }
  }

  async addAttributeToSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id } = req.params;
    const { attributeId, position, isRequired, defaultValue } = req.body as {
      attributeId?: string;
      position?: number;
      isRequired?: boolean;
      defaultValue?: string;
    };
    try {
      const updated = await manageAttributeSetsUseCase.addAttribute(id, { attributeId, position, isRequired, defaultValue });
      jsonResponse(res, 200, { success: true, data: updated });
    } catch (error) {
      respondError(res, error, 'Failed to add attribute to set');
    }
  }

  async removeAttributeFromSet(req: HttpRequest, res: HttpResponse): Promise<void> {
    const { id, attributeId } = req.params;
    await manageAttributeSetsUseCase.removeAttribute(id, attributeId);
    jsonResponse(res, 200, { success: true, message: 'Attribute removed from set' });
  }

  async reorderAttributes(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      await manageAttributeSetsUseCase.reorderAttributes(req.params.id, (req.body as { attributeIds?: unknown }).attributeIds);
      jsonResponse(res, 200, { success: true, message: 'Attributes reordered' });
    } catch (error) {
      respondError(res, error, 'Failed to reorder attributes');
    }
  }
}

export default new AttributeSetController();
