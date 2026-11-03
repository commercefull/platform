import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageAttributeSetsUseCase } from '../../application/useCases/wired';
import { AttributeSetCreateInput, AttributeSetUpdateInput } from '../../application/useCases/ManageAttributeSets';

class AttributeSetController {
  listAttributeSets = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const sets = await manageAttributeSetsUseCase.list();
    jsonResponse(res, 200, { success: true, data: sets });
  };

  getAttributeSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const set = await manageAttributeSetsUseCase.getByIdWithAttributes(req.params.id);
    jsonResponse(res, 200, { success: true, data: set });
  };

  createAttributeSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const set = await manageAttributeSetsUseCase.create(req.body as AttributeSetCreateInput);
    jsonResponse(res, 201, { success: true, data: set });
  };

  updateAttributeSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const updated = await manageAttributeSetsUseCase.update(req.params.id, req.body as AttributeSetUpdateInput);
    jsonResponse(res, 200, { success: true, data: updated });
  };

  deleteAttributeSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    await manageAttributeSetsUseCase.delete(req.params.id);
    jsonResponse(res, 200, { success: true, message: 'Attribute set deleted' });
  };

  addAttributeToSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { attributeId, position, isRequired, defaultValue } = req.body as {
      attributeId?: string;
      position?: number;
      isRequired?: boolean;
      defaultValue?: string;
    };

    const updated = await manageAttributeSetsUseCase.addAttribute(id, { attributeId, position, isRequired, defaultValue });
    jsonResponse(res, 200, { success: true, data: updated });
  };

  removeAttributeFromSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id, attributeId } = req.params;
    await manageAttributeSetsUseCase.removeAttribute(id, attributeId);
    jsonResponse(res, 200, { success: true, message: 'Attribute removed from set' });
  };

  reorderAttributes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    await manageAttributeSetsUseCase.reorderAttributes(req.params.id, (req.body as { attributeIds?: unknown }).attributeIds);
    jsonResponse(res, 200, { success: true, message: 'Attributes reordered' });
  };
}

export default new AttributeSetController();
